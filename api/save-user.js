import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = req.body;

    if (!user || !user.id) {
      return res.status(400).json({ error: 'No user data provided' });
    }

    // Create data folder if it does not exist
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Save user profile as JSON file
    const filePath = join(dataDir, `user_${user.id}.json`);
    writeFileSync(filePath, JSON.stringify(user, null, 2));

    console.log('User saved:', user.id);
    res.status(200).json({ ok: true, id: user.id });

  } catch (err) {
    console.error('Save-user error:', err.message);
    res.status(500).json({ error: err.message });
  }
}