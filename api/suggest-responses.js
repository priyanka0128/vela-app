// ═══════════════════════════════════════════════════════════
// /api/suggest-responses — Listen Mode AI conversation partner
// Takes heard text, returns 3 contextual response suggestions
// ═══════════════════════════════════════════════════════════

export async function suggestResponses(req, res) {
  const { heardText, language = 'es', region = 'spain', recentHistory = [] } = req.body || {};
  if (!heardText) return res.status(400).json({ error: 'Missing heardText' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  const langName = language === 'en' ? 'English' : language === 'fr' ? 'French' : 'Spanish';

  const historyContext = recentHistory.length
    ? '\n\nRecent conversation:\n' + recentHistory.map(m => `${m.who === 'me' ? 'Patient' : 'Other person'}: ${m.text}`).join('\n')
    : '';

  const systemPrompt = `You are helping an ALS patient stay in the conversation. The other person just said something. Generate 3 short response options the patient could say back.

Rules:
- Respond in ${langName} only.
- Each response is 3 to 10 words MAX.
- Give 3 DIFFERENT response types: (1) positive/agreeing, (2) neutral/clarifying, (3) emotional/expressive.
- Sound natural and conversational, like a real person from the patient's region.
- Return ONLY a JSON array of 3 strings. No explanation. No markdown. Example: ["Sí, claro", "¿Qué quieres decir?", "Me alegro mucho"]`;

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
          { role: 'user', content: `Heard: "${heardText}"${historyContext}\n\nReturn 3 response suggestions as a JSON array.` }
        ],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'Groq error: ' + errText });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || '[]';

    // Robust parse — try JSON array directly, or object with "suggestions" key
    let suggestions = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) suggestions = parsed;
      else if (Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions;
      else if (Array.isArray(parsed.responses)) suggestions = parsed.responses;
      else {
        // Try to find first array in the object values
        for (const v of Object.values(parsed)) {
          if (Array.isArray(v)) { suggestions = v; break; }
        }
      }
    } catch {
      // Fallback: regex extract
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) try { suggestions = JSON.parse(match[0]); } catch {}
    }

    suggestions = suggestions.filter(s => typeof s === 'string' && s.length > 0).slice(0, 3);
    return res.status(200).json({ suggestions });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return suggestResponses(req, res);
}
