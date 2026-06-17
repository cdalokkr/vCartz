import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { 
  initDb, 
  query, 
  queryOne, 
  hashPassword, 
  verifyPassword 
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Set large limit to support base64 profile pictures uploads
app.use(express.json({ limit: '5mb' }));

// Initialize database schema
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'vcardz_default_secret_key_12345';

// Generate stateless token using Node.js built-in crypto
function generateToken(userId) {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiry
  const payload = `${userId}.${expiry}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

// Verify stateless token
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [userId, expiry, signature] = parts;
  if (Date.now() > parseInt(expiry, 10)) {
    return null; // Token expired
  }
  
  const expectedPayload = `${userId}.${expiry}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(expectedPayload)
    .digest('hex');
    
  if (signature === expectedSignature) {
    return parseInt(userId, 10);
  }
  return null;
}

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(403).json({ error: 'Session expired: Please log in again' });
  }
  
  req.userId = userId;
  next();
}

// --- AUTH API ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passHash = hashPassword(password);
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [email, passHash]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate stateless token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Verify session
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, avatar_url FROM users WHERE id = $1', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List all registered users (admin managed accounts view)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT id, email, created_at FROM users ORDER BY created_at DESC');
    
    // Format created_at to YYYY-MM-DD
    const formattedUsers = users.map(u => ({
      ...u,
      created_at: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : ''
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update user profile (password and profile avatar)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { password, avatarUrl } = req.body;
  
  try {
    let updateFields = [];
    let params = [];
    let paramCounter = 1;
    
    if (password) {
      const passHash = hashPassword(password);
      updateFields.push(`password_hash = $${paramCounter++}`);
      params.push(passHash);
    }
    
    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramCounter++}`);
      params.push(avatarUrl);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(req.userId);
    const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCounter}`;
    await query(updateSql, params);
    
    const updatedUser = await queryOne('SELECT id, email, avatar_url FROM users WHERE id = $1', [req.userId]);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- CARDS API ENDPOINTS (AUTHENTICATED) ---

// List all user cards
app.get('/api/cards', authenticateToken, async (req, res) => {
  try {
    const cards = await query('SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    
    // Parse social JSON strings back to objects
    const formattedCards = cards.map(card => ({
      ...card,
      socials: card.socials ? JSON.parse(card.socials) : {}
    }));
    
    res.json(formattedCards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create new card
app.post('/api/cards', authenticateToken, async (req, res) => {
  const { 
    slug, name, job_title, company, bio, phone, email, gmap, 
    theme, accent_color, avatar_url, socials, expiry_date, services 
  } = req.body;

  if (!slug || !name) {
    return res.status(400).json({ error: 'Slug and Name are required' });
  }

  // Validate slug format (letters, numbers, hyphens, underscores)
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  if (!slugRegex.test(slug)) {
    return res.status(400).json({ error: 'Slug contains invalid characters. Use letters, numbers, hyphens, and underscores only.' });
  }

  // Verify slug is not a system path
  const systemPaths = ['admin', 'api', 'dashboard', 'login', 'register', 'index.html', 'assets', 'public'];
  if (systemPaths.includes(slug.toLowerCase())) {
    return res.status(400).json({ error: 'This slug name is reserved' });
  }

  try {
    // Check slug availability
    const existingCard = await queryOne('SELECT id FROM cards WHERE slug = $1', [slug.toLowerCase()]);
    if (existingCard) {
      return res.status(400).json({ error: 'Slug already in use. Please select a unique profile path.' });
    }

    const socialsJson = JSON.stringify(socials || {});
    
    if (expiry_date) {
      await query(
        `INSERT INTO cards (user_id, slug, name, job_title, company, bio, phone, email, gmap, theme, accent_color, avatar_url, socials, expiry_date, services)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          req.userId,
          slug.toLowerCase().trim(),
          name,
          job_title || '',
          company || '',
          bio || '',
          phone || '',
          email || '',
          gmap || '',
          theme || 'aura-glass',
          accent_color || '#D3B20D',
          avatar_url || '',
          socialsJson,
          expiry_date,
          services || ''
        ]
      );
    } else {
      await query(
        `INSERT INTO cards (user_id, slug, name, job_title, company, bio, phone, email, gmap, theme, accent_color, avatar_url, socials, services)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          req.userId,
          slug.toLowerCase().trim(),
          name,
          job_title || '',
          company || '',
          bio || '',
          phone || '',
          email || '',
          gmap || '',
          theme || 'aura-glass',
          accent_color || '#D3B20D',
          avatar_url || '',
          socialsJson,
          services || ''
        ]
      );
    }

    res.status(201).json({ message: 'Digital visiting card created successfully' });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update card
app.put('/api/cards/:id', authenticateToken, async (req, res) => {
  const cardId = req.params.id;
  const { 
    slug, name, job_title, company, bio, phone, email, gmap, 
    theme, accent_color, avatar_url, socials, expiry_date, services 
  } = req.body;

  if (!slug || !name) {
    return res.status(400).json({ error: 'Slug and Name are required' });
  }

  try {
    // Check card ownership
    const card = await queryOne('SELECT user_id, slug FROM cards WHERE id = $1', [cardId]);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this card' });
    }

    // If slug is changing, verify new slug uniqueness
    if (slug.toLowerCase() !== card.slug) {
      const existingSlug = await queryOne('SELECT id FROM cards WHERE slug = $1', [slug.toLowerCase()]);
      if (existingSlug) {
        return res.status(400).json({ error: 'Slug already in use. Please select a different slug.' });
      }
    }

    const socialsJson = JSON.stringify(socials || {});
    await query(
      `UPDATE cards 
       SET slug = $1, name = $2, job_title = $3, company = $4, bio = $5, phone = $6, email = $7, gmap = $8, 
           theme = $9, accent_color = $10, avatar_url = $11, socials = $12, expiry_date = $13, services = $14
       WHERE id = $15`,
      [
        slug.toLowerCase().trim(),
        name,
        job_title || '',
        company || '',
        bio || '',
        phone || '',
        email || '',
        gmap || '',
        theme || 'aura-glass',
        accent_color || '#D3B20D',
        avatar_url || '',
        socialsJson,
        expiry_date,
        services || '',
        cardId
      ]
    );

    res.json({ message: 'Visiting card updated successfully' });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete card
app.delete('/api/cards/:id', authenticateToken, async (req, res) => {
  const cardId = req.params.id;

  try {
    const card = await queryOne('SELECT user_id FROM cards WHERE id = $1', [cardId]);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this card' });
    }

    await query('DELETE FROM cards WHERE id = $1', [cardId]);
    res.json({ message: 'Visiting card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- PUBLIC CARD API ENDPOINTS ---

// Fetch card by slug (Viewer)
app.get('/api/public/cards/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();

  try {
    const card = await queryOne('SELECT * FROM cards WHERE slug = $1', [slug]);
    if (!card) {
      return res.status(404).json({ error: 'Visiting card not found' });
    }

    // Check expiry
    const isExpired = card.expiry_date ? new Date(card.expiry_date) < new Date() : false;
    if (isExpired) {
      return res.json({
        expired: true,
        slug: card.slug,
        name: card.name,
        expiry_date: card.expiry_date
      });
    }

    // Increment Views Analytics in the background
    await query(
      'INSERT INTO analytics (card_id, event_type, event_detail) VALUES ($1, $2, $3)',
      [card.id, 'views', 'page']
    );

    // Format output
    const formattedCard = {
      id: card.id,
      slug: card.slug,
      name: card.name,
      job_title: card.job_title,
      company: card.company,
      bio: card.bio,
      phone: card.phone,
      email: card.email,
      gmap: card.gmap,
      theme: card.theme,
      accent_color: card.accent_color,
      avatar_url: card.avatar_url,
      expiry_date: card.expiry_date,
      socials: card.socials ? JSON.parse(card.socials) : {},
      services: card.services || ''
    };

    res.json(formattedCard);
  } catch (error) {
    console.error('Error fetching public card:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Public Card Renewal
app.post('/api/public/cards/:slug/renew', async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  const { plan } = req.body; // '1_month', '6_months', '12_months'

  if (!plan) {
    return res.status(400).json({ error: 'Renewal plan is required' });
  }

  let daysToAdd = 30;
  if (plan === '6_months') daysToAdd = 180;
  if (plan === '12_months') daysToAdd = 365;

  try {
    const card = await queryOne('SELECT id, expiry_date FROM cards WHERE slug = $1', [slug]);
    if (!card) {
      return res.status(404).json({ error: 'Visiting card not found' });
    }

    const currentExpiry = card.expiry_date ? new Date(card.expiry_date) : new Date();
    const now = new Date();
    
    // If expired, extend from today. If still active, extend from current expiry.
    const baseDate = currentExpiry < now ? now : currentExpiry;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpiryStr = baseDate.toISOString();

    await query(
      'UPDATE cards SET expiry_date = $1 WHERE id = $2',
      [newExpiryStr, card.id]
    );

    // Log renewal analytics
    await query(
      "INSERT INTO analytics (card_id, event_type, event_detail) VALUES ($1, 'renew', $2)",
      [card.id, plan]
    );

    res.json({
      success: true,
      new_expiry: newExpiryStr,
      message: `Card profile validity extended by ${daysToAdd} days!`
    });
  } catch (error) {
    console.error('Error renewing card:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Log public card interactions (Clicks on links)
app.post('/api/public/analytics/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  const { event_type, event_detail } = req.body; // e.g. event_type: 'click_social', event_detail: 'linkedin'

  if (!event_type) {
    return res.status(400).json({ error: 'event_type is required' });
  }

  try {
    const card = await queryOne('SELECT id FROM cards WHERE slug = $1', [slug]);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await query(
      'INSERT INTO analytics (card_id, event_type, event_detail) VALUES ($1, $2, $3)',
      [card.id, event_type, event_detail || '']
    );

    res.json({ message: 'Interaction logged successfully' });
  } catch (error) {
    console.error('Error logging analytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- ANALYTICS RETRIEVAL (AUTHENTICATED) ---
app.get('/api/cards/:id/analytics', authenticateToken, async (req, res) => {
  const cardId = req.params.id;

  try {
    // Verify ownership
    const card = await queryOne('SELECT user_id FROM cards WHERE id = $1', [cardId]);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get total views
    const viewsCount = await queryOne(
      "SELECT COUNT(*) as count FROM analytics WHERE card_id = $1 AND event_type = 'views'",
      [cardId]
    );

    // Get clicks count
    const clicksCount = await queryOne(
      "SELECT COUNT(*) as count FROM analytics WHERE card_id = $1 AND event_type != 'views'",
      [cardId]
    );

    // Get action breakdown
    const actionBreakdown = await query(
      `SELECT event_type, event_detail, COUNT(*) as count 
       FROM analytics 
       WHERE card_id = $1 
       GROUP BY event_type, event_detail`,
      [cardId]
    );

    // Get last 7 days visitor stats (Daily Trends)
    // Works cross-compatible between PostgreSQL and SQLite by doing formatted datetime selections
    const dailyStats = await query(
      `SELECT Date(timestamp) as date_str, COUNT(*) as count 
       FROM analytics 
       WHERE card_id = $1 AND event_type = 'views' 
       GROUP BY Date(timestamp) 
       ORDER BY date_str DESC 
       LIMIT 7`,
      [cardId]
    );

    res.json({
      views: parseInt(viewsCount.count || viewsCount.COUNT || 0),
      clicks: parseInt(clicksCount.count || clicksCount.COUNT || 0),
      breakdown: actionBreakdown.map(b => ({
        type: b.event_type,
        detail: b.event_detail,
        count: parseInt(b.count || b.COUNT || 0)
      })),
      trends: dailyStats.map(t => ({
        date: t.date_str || t.DATE_STR,
        count: parseInt(t.count || t.COUNT || 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Express Server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`vCardz Backend running on port ${PORT}`);
  });
}

export default app;
