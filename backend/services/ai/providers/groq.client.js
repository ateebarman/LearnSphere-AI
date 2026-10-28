// Groq API Provider Client
// OpenAI-compatible API using GPT-OSS 120B / 20B for strong JSON generation

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

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

  // Strategy 1: Direct Parse (Fastest, trusts the model)
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Strategy 2: Extract substring between braces (Handles conversational filler)
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const candidate = text.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(candidate);
        } catch (e2) {
          // Strategy 3: Clean and Parse (Fixes unescaped newlines/chars)
          return JSON.parse(clean(candidate));
        }
      }
    } catch (e3) {
      // Strategy 4: Final fallback - aggressive markdown removal and cleaning
      let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const candidate = cleanedText.substring(firstBrace, lastBrace + 1);
          return JSON.parse(clean(candidate));
        } catch (e4) {
          throw new Error(`Invalid JSON format: ${e4.message}`);
        }
      }
    }
    throw new Error(`JSON Extraction Failed: ${e1.message}`);
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

export const generateJsonGroq = async (prompt, modelOrOptions = null, retryCount = 0) => {
  if (apiKeys.length === 0) initializeGroq();
  if (apiKeys.length === 0) throw new Error('No Groq API keys configured');

  // Support signatures: generateJsonGroq(prompt), generateJsonGroq(prompt, model), generateJsonGroq(prompt, retryCount)
  let targetModel = process.env.GROQ_MODEL || DEFAULT_MODEL;
  let actualRetry = 0;

  if (typeof modelOrOptions === 'string' && modelOrOptions.trim()) {
    targetModel = modelOrOptions.trim();
    actualRetry = typeof retryCount === 'number' ? retryCount : 0;
  } else if (typeof modelOrOptions === 'number') {
    actualRetry = modelOrOptions;
  }

  const apiKey = apiKeys[currentKeyIndex];

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
        model: targetModel,
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
        console.warn(`🔄 Groq Key ${currentKeyIndex + 1} rate-limited on model ${targetModel}.`);
        if (actualRetry < apiKeys.length - 1) {
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          return generateJsonGroq(prompt, targetModel, actualRetry + 1);
        }
      }
      throw new Error(`Groq API Error: ${data.error?.message || 'Unknown'}`);
    }

    const content = data.choices[0].message.content;
    return extractJSON(content);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`❌ Groq Key ${currentKeyIndex + 1} timed out on model ${targetModel}.`);
    } else {
      console.error(`❌ Groq Error (Key ${currentKeyIndex + 1}, Model ${targetModel}):`, error.message);
    }
    
    // Failover to next key on error
    if (actualRetry < apiKeys.length - 1) {
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      console.log(`🔄 Attempting Groq failover to Key ${currentKeyIndex + 1}...`);
      return generateJsonGroq(prompt, targetModel, actualRetry + 1);
    }

    // Secondary model failover: If primary model failed across all keys, fallback to 20B
    if (targetModel !== FALLBACK_MODEL && (!modelOrOptions || modelOrOptions === DEFAULT_MODEL)) {
      console.warn(`⚠️ All Groq keys failed for ${targetModel}. Attempting fallback to ${FALLBACK_MODEL}...`);
      currentKeyIndex = 0;
      return generateJsonGroq(prompt, FALLBACK_MODEL, 0);
    }

    throw error;
  }
};
