export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (typeof req.body === 'string') req.body = JSON.parse(req.body);
    const { audioBase64, fileName, voiceName } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'No audio provided' });

    console.log('Cloning voice:', voiceName);
    console.log('API KEY START:', process.env.ELEVENLABS_API_KEY?.substring(0, 8));

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('name', voiceName || 'Vela Patient Voice');
    formData.append('files', blob, fileName || 'voice.webm');
    formData.append('description', 'Patient voice for Vela communication system');

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: formData
    });

    const data = await response.json();
    console.log('ElevenLabs clone response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      throw new Error(data.detail?.message || data.detail || JSON.stringify(data));
    }

    res.status(200).json({
      voiceId:   data.voice_id,
      voiceName: voiceName || 'Patient Voice'
    });

  } catch (err) {
    console.error('Clone error:', err.message);
    res.status(500).json({ error: err.message });
  }
}