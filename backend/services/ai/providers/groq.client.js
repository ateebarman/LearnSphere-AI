// Groq API Provider Client
// OpenAI-compatible API using llama3-70b for strong JSON generation

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const extractJSON = (text) => {
  const clean = (jsonStr) => {
    return jsonStr
      .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"') // fix "smart" quotes
      .replace(/`([^`]*)`/g, '"$1"') // Convert backticks to double quotes
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, contents) => {
        // Replace raw newlines inside the string contents with escaped \n
        return '"' + contents.replace(/\n/g, '\\n') + '"';
      });
  };

  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }

    const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(clean(jsonCandidate));
  } catch (error) {
    // Strategy 2: Aggressive markdown removal
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        const candidate = cleanedText.substring(firstBrace, lastBrace + 1);
        return JSON.parse(clean(candidate));
      } catch (e) {
        throw new Error(`JSON parsing failed: ${e.message}`);
      }
    }
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
};

let currentKeyIndex = 0;

export const generateJsonGroq = async (prompt, modelOverride = null) => {
  const apiKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY2,
    process.env.GROQ_API_KEY3,
    process.env.GROQ_API_KEY4
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    throw new Error('No Groq API keys configured');
  }

  const model = modelOverride || 'llama-3.3-70b-versatile';
  const apiKey = apiKeys[currentKeyIndex];

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a technical coding assistant that responds ONLY with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // Rotate key on rate limit
      if (res.status === 429) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.warn(`🔄 Groq key rate-limited. Switched to key ${currentKeyIndex + 1}`);
      }
      throw new Error(`Groq API Error (Key ${currentKeyIndex + 1}, Model ${model}): ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;
    return extractJSON(content);
  } catch (error) {
    console.error(`❌ Groq Error:`, error.message);
    throw error;
  }
};
