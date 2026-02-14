// Groq API Provider Client
// OpenAI-compatible API using llama3-70b for strong JSON generation

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const extractJSON = (text) => {
  try {
    // Strategy 1: Find the first { and the last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }

    const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
    
    // Fix common AI JSON errors before parsing
    const fixed = jsonCandidate
      .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"') // fix "smart" quotes
      .replace(/\n/g, ' '); // remove newlines for safer parsing
      
    return JSON.parse(fixed);
  } catch (error) {
    // Strategy 2: More aggressive cleaning
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        const candidate = cleaned.substring(firstBrace, lastBrace + 1)
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/[\u201C\u201D\u2018\u2019]/g, '"');
        return JSON.parse(candidate);
      } catch (e) {
        console.error('❌ JSON Parse Failed:', e.message);
        throw new Error(`Failed to parse JSON: ${e.message}`);
      }
    }
    throw new Error('Invalid JSON format from AI');
  }
};

let currentKeyIndex = 0;

export const generateJsonGroq = async (prompt) => {
  const keys = Object.keys(process.env)
    .filter(key => key.startsWith('GROQ_API_KEY'))
    .map(key => process.env[key])
    .filter(Boolean);
  
  if (keys.length === 0) {
    throw new Error('No general Groq API keys set (Looking for GROQ_API_KEY, GROQ_API_KEY2, etc.)');
  }

  const apiKey = keys[currentKeyIndex % keys.length];
  const model = 'llama-3.3-70b-versatile';
  
  currentKeyIndex++;

  const fullPrompt = `${prompt}\nRespond ONLY with valid JSON. No markdown. No explanations.`;

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a JSON-only API. Respond with only valid JSON, no markdown, no explanations.' },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.6,
        max_tokens: 4096
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      const msg = errorData?.error?.message || JSON.stringify(errorData);
      throw new Error(`Groq API error: ${res.status} - ${msg}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty Groq response');

    return extractJSON(text);
  } catch (error) {
    console.error(`❌ Groq API Error (Key ${currentKeyIndex % keys.length + 1}, Model ${model}):`, error.message);
    throw error;
  }
};
