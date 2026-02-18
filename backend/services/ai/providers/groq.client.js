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

let apiKeys = [];
let currentKeyIndex = 0;

export const initializeGroq = () => {
  apiKeys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GROQ_API_KEY${i}`];
    if (key) apiKeys.push(key);
  }
  console.log(`✅ Groq Service initialized with ${apiKeys.length} keys`);
};

export const generateJsonGroq = async (prompt, retryCount = 0) => {
  if (apiKeys.length === 0) initializeGroq();
  if (apiKeys.length === 0) throw new Error('No Groq API keys configured');

  const apiKey = apiKeys[currentKeyIndex];
  const model = 'llama-3.3-70b-versatile';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
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

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`🔄 Groq Key ${currentKeyIndex + 1} rate-limited.`);
        if (retryCount < apiKeys.length - 1) {
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          return generateJsonGroq(prompt, retryCount + 1);
        }
      }
      throw new Error(`Groq API Error: ${data.error?.message || 'Unknown'}`);
    }

    const content = data.choices[0].message.content;
    return extractJSON(content);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`❌ Groq Key ${currentKeyIndex + 1} timed out.`);
    } else {
      console.error(`❌ Groq Error (Key ${currentKeyIndex + 1}):`, error.message);
    }
    
    // Failover to next key on ANY error
    if (retryCount < apiKeys.length - 1) {
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      console.log(`🔄 Attempting Groq failover to Key ${currentKeyIndex + 1}...`);
      return generateJsonGroq(prompt, retryCount + 1);
    }
    throw error;
  }
};
