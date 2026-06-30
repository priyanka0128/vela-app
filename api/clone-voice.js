// ═══════════════════════════════════════════════════════════
// /api/clone-voice — ElevenLabs instant voice cloning
// ═══════════════════════════════════════════════════════════

export async function cloneVoice(req, res) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  // Express (multer) → req.file. Vercel → manual multipart parse.
  let audioBuffer, voiceName;

  if (req.file) {
    audioBuffer = req.file.buffer;
    voiceName = req.body.name || 'Vela voice';
  } else {
    // Vercel serverless: parse multipart from raw body
    try {
      const formData = await parseMultipart(req);
      audioBuffer = formData.audio;
      voiceName = formData.name || 'Vela voice';
    } catch (e) {
      return res.status(400).json({ error: 'Could not parse upload: ' + e.message });
    }
  }

  if (!audioBuffer) return res.status(400).json({ error: 'No audio file received' });

  try {
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    form.append('files', blob, 'voice.webm');
    form.append('name', voiceName);
    form.append('description', 'Vela patient voice clone');

    const r = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: form
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'ElevenLabs error: ' + errText });
    }
    const data = await r.json();
    return res.status(200).json({ voiceId: data.voice_id, name: voiceName });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Minimal multipart parser for Vercel serverless
async function parseMultipart(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) throw new Error('No multipart boundary');
  const result = {};
  const parts = buffer.toString('binary').split('--' + boundary);
  for (const part of parts) {
    if (!part.includes('Content-Disposition')) continue;
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const value = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));
    if (part.includes('filename=')) {
      result[name] = Buffer.from(value, 'binary');
    } else {
      result[name] = value;
    }
  }
  return result;
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return cloneVoice(req, res);
}

export const config = { api: { bodyParser: false } };
