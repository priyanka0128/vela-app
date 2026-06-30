// ═══════════════════════════════════════════════════════════
// VELA — Local development server
// In production, Vercel serverless functions in /api/ handle routes.
// This server.js mirrors them for `node server.js` local dev.
// ═══════════════════════════════════════════════════════════
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { rewrite } from './api/rewrite.js';
import { cloneVoice } from './api/clone-voice.js';
import { speakCloned } from './api/speak-cloned.js';
import { suggestResponses } from './api/suggest-responses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Wrap Vercel-style handlers for Express
const wrap = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: e.message });
  }
};

app.post('/api/rewrite', wrap(rewrite));
app.post('/api/clone-voice', upload.single('audio'), wrap(cloneVoice));
app.post('/api/speak-cloned', wrap(speakCloned));
app.post('/api/suggest-responses', wrap(suggestResponses));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vela running at http://localhost:${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}/landing.html`);
});
