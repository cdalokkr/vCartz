import { spawn } from 'child_process';

console.log('\x1b[35m[vCardz]\x1b[0m Starting Backend database and React frontend concurrently...');

const server = spawn('npm', ['run', 'server'], { shell: true, stdio: 'inherit' });
const dev = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'inherit' });

// Handle termination safely
const handleExit = () => {
  server.kill();
  dev.kill();
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
