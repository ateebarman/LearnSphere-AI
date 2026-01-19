// Groq API Provider Client
// OpenAI-compatible API using llama3-70b for strong JSON generation

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const extractJSON = (text) => {
  // Clean markdown code blocks if present
  let cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  // Try to extract JSON more aggressively if above fails
  if (!cleanText.startsWith('{')) {
    cleanText = text.replace(/```/g, '').trim();
  }

  // Find JSON object in text
  const match = cleanText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in Groq response');

  return JSON.parse(match[0]);
};

export const generateJsonGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set');
  }

  const fullPrompt = `${prompt}\nRespond ONLY with valid JSON. No markdown. No explanations.`;

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only API. Respond with only valid JSON, no markdown, no explanations.' },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8192
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Groq API error: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty Groq response');

    return extractJSON(text);
  } catch (error) {
    console.error('❌ Groq API Error:', error.message);
    throw error;
  }
};
