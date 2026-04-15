export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (typeof req.body === 'string') req.body = JSON.parse(req.body);
    const { text, voiceId } = req.body;

    if (!text) return res.status(400).json({ error: 'No text provided' });

    if (!voiceId) {
      console.log('No voiceId — using browser speech');
      return res.status(200).json({ useBrowser: true });
    }

    console.log('Speaking with ElevenLabs voice:', voiceId);
    console.log('Text:', text.substring(0, 80));

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability:         0.5,
            similarity_boost:  0.85,
            style:             0.2,
            use_speaker_boost: true
          }
        })
      }
    );

    console.log('ElevenLabs TTS status:', response.status);

    if (!response.ok) {
      const errData = await response.json();
      console.error('ElevenLabs TTS error:', JSON.stringify(errData));
      return res.status(200).json({ useBrowser: true });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error('Speak-cloned error:', err.message);
    res.status(200).json({ useBrowser: true });
  }
}