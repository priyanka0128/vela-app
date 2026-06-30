// ═══════════════════════════════════════════════════════════
// /api/rewrite — Groq personality engine + emotion framing
// ═══════════════════════════════════════════════════════════

const REGION_PROMPTS = {
  'spain':            'Madrid Spanish — neutral peninsular',
  'spain-andalucia':  'Andalucian Spanish — warm, drops final s, casual',
  'spain-catalonia':  'Catalan-influenced Spanish — slightly formal',
  'mexico':           'Mexican Spanish — warm, friendly, uses "órale", "qué onda"',
  'argentina':        'Rioplatense Spanish — voseo, "che", "boludo"',
  'colombia':         'Colombian Spanish — polite, gentle, "parce", "chévere"',
  'cuba':             'Cuban Spanish — energetic, "asere", "qué bolá"',
  'uk':               'British English — dry, understated',
  'ireland':          'Irish English — warm, lyrical, "grand", "deadly"',
  'us':               'American English — direct, friendly',
  'france':           'Parisian French — slightly formal',
  'canada-fr':        'Québécois French — warm, informal'
};

const EMOTION_INSTRUCTIONS = {
  neutral: '',
  happy:   'Frame this message with warmth and positivity.',
  sad:     'Frame this message with soft sadness and vulnerability.',
  calm:    'Frame this message with slow, peaceful calm.',
  urgent:  'Frame this message with urgency — keep it short and direct.',
  gentle:  'Frame this message gently and softly.',
  excited: 'Frame this message with high energy and excitement.',
  tender:  'Frame this message tenderly, with love.'
};

export async function rewrite(req, res) {
  const { text, emotion = 'neutral', region = 'spain', slang = 50, humour = 50, energy = 50, language = 'es' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  const langName = language === 'en' ? 'English' : language === 'fr' ? 'French' : 'Spanish';
  const regionDesc = REGION_PROMPTS[region] || REGION_PROMPTS['spain'];
  const emotionLine = EMOTION_INSTRUCTIONS[emotion] || '';

  const slangLevel = slang > 70 ? 'heavy slang and informality' : slang > 40 ? 'casual everyday tone' : 'formal, polished tone';
  const humourLevel = humour > 70 ? 'playful and witty' : humour > 40 ? 'lightly warm' : 'serious';
  const energyLevel = energy > 70 ? 'lively and animated' : energy > 40 ? 'balanced' : 'calm and measured';

  const systemPrompt = `You are rewriting messages for an ALS patient using their assistive communication device.
The patient speaks ${langName} with this style: ${regionDesc}.
Tone: ${slangLevel}, ${humourLevel}, ${energyLevel}.
${emotionLine}

Rules:
- Keep the message SHORT — at most 15 words.
- Keep the original MEANING intact.
- Make it sound like a real person from that region, not a translation.
- Return ONLY the rewritten message in ${langName}. No quotes, no explanation, no preamble.`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'Groq error: ' + errText });
    }
    const data = await r.json();
    const out = data.choices?.[0]?.message?.content?.trim() || text;
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Vercel handler
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return rewrite(req, res);
}
