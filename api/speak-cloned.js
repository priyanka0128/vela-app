// ═══════════════════════════════════════════════════════════
// /api/speak-cloned — ElevenLabs TTS with emotion modulation
// 8 emotions: neutral, happy, sad, calm, urgent, gentle, excited, tender
// ═══════════════════════════════════════════════════════════

const EMOTION_SETTINGS = {
  neutral: { stability: 0.5,  similarity_boost: 0.75, style: 0.0,  use_speaker_boost: true },
  happy:   { stability: 0.15, similarity_boost: 0.7,  style: 0.95, use_speaker_boost: true },
  sad:     { stability: 0.9,  similarity_boost: 0.9,  style: 0.0,  use_speaker_boost: true },
  calm:    { stability: 0.95, similarity_boost: 0.9,  style: 0.0,  use_speaker_boost: true },
  urgent:  { stability: 0.1,  similarity_boost: 0.65, style: 1.0,  use_speaker_boost: true },
  gentle:  { stability: 0.8,  similarity_boost: 0.95, style: 0.1,  use_speaker_boost: true },
  excited: { stability: 0.05, similarity_boost: 0.65, style: 1.0,  use_speaker_boost: true },
  tender:  { stability: 0.75, similarity_boost: 0.95, style: 0.15, use_speaker_boost: true }
};

const AUDIO_TAGS = {
  happy:   '[cheerfully]',
  sad:     '[sadly, softly]',
  calm:    '[calmly, slowly]',
  urgent:  '[urgently, loudly]',
  gentle:  '[gently, warmly]',
  excited: '[excitedly]',
  tender:  '[tenderly, softly]'
};

export async function speakCloned(req, res) {
  const { text, voiceId, emotion = 'neutral' } = req.body || {};
  if (!text || !voiceId) return res.status(400).json({ error: 'Missing text or voiceId' });
  if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });

  const voice_settings = EMOTION_SETTINGS[emotion] || EMOTION_SETTINGS.neutral;
  const tag = AUDIO_TAGS[emotion] || '';
  const finalText = tag ? `${tag} ${text}` : text;

  // Try v3 first (best emotional range), fall back to multilingual_v2
  const models = ['eleven_v3', 'eleven_multilingual_v2'];
  let lastError = null;

  for (const model_id of models) {
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: model_id === 'eleven_v3' ? finalText : text,
          model_id,
          voice_settings
        })
      });

      if (!r.ok) {
        lastError = await r.text();
        continue;
      }

      const buffer = Buffer.from(await r.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    } catch (e) {
      lastError = e.message;
    }
  }

  return res.status(500).json({ error: 'TTS failed: ' + lastError });
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return speakCloned(req, res);
}
