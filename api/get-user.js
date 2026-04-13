import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: 'No user ID provided' });
    }

    const filePath = join(__dirname, '..', 'data', `user_${id}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = JSON.parse(readFileSync(filePath, 'utf8'));
    res.status(200).json(user);

  } catch (err) {
    console.error('Get-user error:', err.message);
    res.status(500).json({ error: err.message });
  }
}