import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env.local file
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Import all API route handlers
import rewrite from './api/rewrite.js';
import cloneSpeak from './api/clone-speak.js';
import saveUser from './api/save-user.js';
import getUser from './api/get-user.js';

// Register routes
app.post('/api/rewrite', (req, res) => rewrite(req, res));
app.post('/api/clone-speak', (req, res) => cloneSpeak(req, res));
app.post('/api/save-user', (req, res) => saveUser(req, res));
app.get('/api/get-user', (req, res) => getUser(req, res));

// Start server
app.listen(3000, () => {
  console.log('Vela running at http://localhost:3000');
});