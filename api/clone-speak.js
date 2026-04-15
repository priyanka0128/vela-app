export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Always use browser speech
  // HuggingFace removed — ElevenLabs handles cloned voice via speak-cloned.js
  res.status(200).json({ useBrowser: true });
}