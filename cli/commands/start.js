import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '../utils/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startServer(options = {}) {
  const config = getConfig();
  const port = options.port || config.port || 3000;

  const backendPath = path.join(__dirname, '../../backend/server.js');

  console.log(`Starting server on port ${port}...`);

  const server = spawn('node', [backendPath], {
    env: { ...process.env, PORT: port },
    stdio: 'inherit'
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}
