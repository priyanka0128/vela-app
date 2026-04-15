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

    const prompt = `You are helping a person with ALS communicate naturally.
They selected these pictograms: ${text}

Their profile:
Region: ${profile?.region || 'Ireland'}
Language: ${profile?.lang || 'en'}
Tone: ${profile?.tone || 'casual'}

Convert the pictogram labels into ONE natural sentence that a real person would say.
Examples:
- "Eat, Water" → "I would like something to eat and some water please."
- "Help, Pain" → "I need help, I am in pain."
- "Happy, Love" → "I am feeling happy, I love you."
- "Medicine, Doctor" → "I need my medicine and I want to see the doctor."
- "Tired, Sleep" → "I am very tired, I need to sleep."

Rules:
- Write in the person's language (${profile?.lang || 'en'})
- Sound warm and natural like a real person speaking
- One sentence only
- No slang endings like tío, venga, man, dude
- Return ONLY the sentence, nothing else`;

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