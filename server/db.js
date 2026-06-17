import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;
let dbInstance = null;

// Initialize connection
if (isPostgres) {
  console.log('Database Client: PostgreSQL (Supabase/Vercel)');
  dbInstance = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase in many environments
    }
  });
} else {
  console.log('Database Client: SQLite (Local/Hostinger VPS)');
  const sqlite3 = (await import('sqlite3')).default;
  const dbFile = path.resolve(__dirname, '../database.sqlite');
  dbInstance = new sqlite3.Database(dbFile);
}

// Helper to run query with dynamic parameter mapping
export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (isPostgres) {
      dbInstance.query(sql, params, (err, res) => {
        if (err) return reject(err);
        resolve(res.rows);
      });
    } else {
      // Map PostgreSQL positional parameters ($1, $2, etc.) to SQLite positional parameters (?)
      const sqliteSql = sql.replace(/\$[0-9]+/g, '?');
      
      // Select driver operation depending on action type
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        dbInstance.all(sqliteSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        dbInstance.run(sqliteSql, params, function (err) {
          if (err) return reject(err);
          // Return inserted id or changes metadata
          resolve({ insertId: this.lastID, changes: this.changes });
        });
      }
    }
  });
}

// Helper for queries returning a single row
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Database Schema Initializer
export async function initDb() {
  const usersTable = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`;

  const cardsTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        job_title VARCHAR(255),
        company VARCHAR(255),
        bio TEXT,
        phone VARCHAR(255),
        email VARCHAR(255),
        gmap VARCHAR(255),
        theme VARCHAR(50) DEFAULT 'aura-glass',
        accent_color VARCHAR(50) DEFAULT '#D3B20D',
        avatar_url TEXT,
        socials TEXT,
        services TEXT,
        expiry_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        job_title TEXT,
        company TEXT,
        bio TEXT,
        phone TEXT,
        email TEXT,
        gmap TEXT,
        theme TEXT DEFAULT 'aura-glass',
        accent_color TEXT DEFAULT '#D3B20D',
        avatar_url TEXT,
        socials TEXT,
        services TEXT,
        expiry_date DATETIME DEFAULT (datetime('now', '+30 days')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`;

  const analyticsTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_detail VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_detail TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );`;

  try {
    await query(usersTable);
    await query(cardsTable);
    await query(analyticsTable);
    
    // Ensure column existence (for upgrading existing database.sqlite)
    try {
      await query('SELECT expiry_date FROM cards LIMIT 1');
    } catch (colErr) {
      console.log('Database Upgrade: Adding expiry_date column to cards table...');
      if (isPostgres) {
        await query("ALTER TABLE cards ADD COLUMN expiry_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');");
      } else {
        // SQLite does not support non-constant defaults on ALTER TABLE ADD COLUMN.
        // We add the column first, then update existing null rows.
        await query("ALTER TABLE cards ADD COLUMN expiry_date DATETIME;");
        await query("UPDATE cards SET expiry_date = datetime('now', '+30 days') WHERE expiry_date IS NULL;");
      }
    }

    // Ensure services column exists in cards table
    try {
      await query('SELECT services FROM cards LIMIT 1');
    } catch (colErr) {
      console.log('Database Upgrade: Adding services column to cards table...');
      await query("ALTER TABLE cards ADD COLUMN services TEXT;");
    }

    // Ensure about_us column exists in cards table
    try {
      await query('SELECT about_us FROM cards LIMIT 1');
    } catch (colErr) {
      console.log('Database Upgrade: Adding about_us column to cards table...');
      await query("ALTER TABLE cards ADD COLUMN about_us TEXT;");
    }

    // Ensure address column exists in cards table
    try {
      await query('SELECT address FROM cards LIMIT 1');
    } catch (colErr) {
      console.log('Database Upgrade: Adding address column to cards table...');
      await query("ALTER TABLE cards ADD COLUMN address TEXT;");
    }

    // Ensure avatar_url column exists in users table
    try {
      await query('SELECT avatar_url FROM users LIMIT 1');
    } catch (colErr) {
      console.log('Database Upgrade: Adding avatar_url column to users table...');
      await query("ALTER TABLE users ADD COLUMN avatar_url TEXT;");
    }
    
    console.log('Database schema verified successfully.');
    
    // Seed default admin and profile if empty
    await seedDefaultData();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Hashing helper using Node.js built-in crypto module (No bcrypt npm install issues)
import crypto from 'crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Seed default accounts and cards so vCardz works immediately
async function seedDefaultData() {
  try {
    const userCount = await queryOne('SELECT COUNT(*) as count FROM users');
    const count = parseInt(userCount.count || userCount.COUNT || 0);

    if (count === 0) {
      console.log('Seeding default data...');
      
      // Default credentials: admin@vcartz.com / password123
      const passHash = hashPassword('password123');
      await query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
        ['admin@vcartz.com', passHash]
      );
      
      const adminUser = await queryOne('SELECT id FROM users WHERE email = $1', ['admin@vcartz.com']);
      const adminId = adminUser.id;

      // Default card: Sarah Jenkins (slug: sarah)
      const defaultSocials = JSON.stringify({
        lnkLinkedIn: 'https://linkedin.com',
        lnkTwitter: 'https://twitter.com',
        lnkWa: '15550192834',
        lnkFb: 'https://facebook.com',
        lnkInsta: 'https://instagram.com'
      });

      await query(
        `INSERT INTO cards (user_id, slug, name, job_title, company, bio, phone, email, gmap, theme, accent_color, avatar_url, socials) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          adminId,
          'sarah',
          'Sarah Jenkins',
          'Creative Director',
          'Aether Studio',
          'Crafting meaningful digital experiences. Specializing in UI/UX design and motion effects.',
          '+1 (555) 019-2834',
          'sarah@aetherstudio.com',
          'https://maps.google.com/?q=San+Francisco',
          'aura-glass',
          '#D3B20D',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          defaultSocials
        ]
      );
      
      console.log('Seeding default user and card (slug: sarah) complete.');
    }
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
}
