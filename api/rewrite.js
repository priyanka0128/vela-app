export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, profile } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('KEY START:', process.env.GROQ_API_KEY?.substring(0, 8));

    const prompt = `You rewrite text to match a person's natural speaking voice.

Region: ${profile?.region || 'Ireland'}
Language: ${profile?.lang || 'en'}
Tone: ${profile?.tone || 'casual'}
Humour level: ${profile?.humour || 'medium'}
Slang level: ${profile?.slang || 'low'}
Energy level: ${profile?.energy || 'medium'}

Rules:
- Keep the exact same meaning
- ALWAYS write the output in the person's language — if language is es-ES or es-MX write in Spanish, if en write in English
- Use regional dialect, slang and expressions natural to that region
- For Spain use Spanish slang like tío, joder, macho, venga, hostia
- For Mexico use Mexican slang like wey, no manches, órale, chido, qué onda
- Match the tone and humour level
- Return ONLY the rewritten sentence, nothing else

Text to rewrite: ${text}`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    console.log('GROQ RESPONSE:', JSON.stringify(data).substring(0, 200));

    if (!data.choices || !data.choices[0]) {
      throw new Error('Groq returned no response. Check your API key.');
    }

    const result = data.choices[0].message.content.trim();
    res.status(200).json({ result });

  } catch (err) {
    console.error('Rewrite error:', err.message);
    res.status(500).json({ error: err.message });
  }
}