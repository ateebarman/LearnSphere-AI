// Gemini API Provider Client
// Single API key, no rotation, single request attempt

let apiKeys = [];
let currentKeyIndex = 0;

// Rate Limiter State
const RPM_LIMIT = 15;
const requestHistory = new Map(); // Key -> Array of timestamps

export const initializeGemini = () => {
  apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4
  ].filter(Boolean);

  if (apiKeys.length > 0) {
    apiKeys.forEach(key => requestHistory.set(key, []));
    console.log(`✅ Gemini Service initialized with ${apiKeys.length} keys (Using 2.5 Pro & 2.0 Flash only)`);
  } else {
    console.log('⚠️  No Gemini API keys found - will use demo mode');
  }
};

const getNextApiKey = async () => {
  if (apiKeys.length === 0) return null;
  
  // Try all keys to find one within limit
  for (let i = 0; i < apiKeys.length; i++) {
    const index = (currentKeyIndex + i) % apiKeys.length;
    const key = apiKeys[index];
    const now = Date.now();
    
    // Clean history
    const history = requestHistory.get(key).filter(time => now - time < 60000);
    requestHistory.set(key, history);

    if (history.length < RPM_LIMIT) {
      currentKeyIndex = (index + 1) % apiKeys.length;
      history.push(now);
      return key;
    }
  }

  // All keys full? Wait 5 seconds and try again
  console.log('⏳ All Gemini keys at RPM limit. Waiting 5s...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  return getNextApiKey();
};

const extractJSON = (text) => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }

    const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
    
    // Fix common AI JSON errors before parsing
    const fixed = jsonCandidate
      .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
      .replace(/[\u201C\u201D]/g, '"') // fix "smart" quotes
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, contents) => {
        // Replace raw newlines inside the string contents with escaped \n
        return '"' + contents.replace(/\n/g, '\\n') + '"';
      });
      
    return JSON.parse(fixed);
  } catch (parseError) {
    console.error('❌ Gemini JSON Extract Failed:', parseError.message);
    // Last ditch: try to see if it's just raw text within code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (cleaned.startsWith('{')) {
      try { return JSON.parse(cleaned); } catch (e) {}
    }
    throw new Error(`JSON parsing failed: ${parseError.message}`);
  }
};

export const generateJsonGemini = async (prompt, retryCount = 0) => {
  const currentKey = await getNextApiKey();
  if (!currentKey) {
    throw new Error('No Gemini API key configured');
  }

  const fullPrompt = `${prompt}

CRITICAL INSTRUCTIONS:
- Respond ONLY with valid JSON, nothing else
- Do NOT wrap in markdown code blocks
- Do NOT include any text before or after the JSON
- Ensure all strings use double quotes
- All commas and brackets must be valid
- Test your JSON is parseable before responding`;

  const models = [
    'gemini-2.5-pro',
    'gemini-2.0-flash'
  ];

  let lastError = null;

  for (const modelId of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.6,
              topK: 1,
              topP: 1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      const data = await res.json();

      // Check for specifically 429 quota errors
      if (res.status === 429 || data.error?.code === 429) {
        console.warn(`⚠️ Model ${modelId} rate limited on key ${retryCount + 1}.`);
        continue;
      }

      if (!res.ok) {
        throw new Error(`API_ERROR_${res.status}: ${data.error?.message}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from model');
      
      try {
        const result = extractJSON(text);
        console.log(`✅ Success with Gemini ${modelId} on key ${retryCount + 1}`);
        return result;
      } catch (e) {
        console.log(`--- RAW GEMINI TEXT (${modelId}) ---`);
        console.log(text);
        console.log('-----------------------');
        throw e;
      }
    } catch (err) {
      lastError = err;
      console.warn(`❌ Gemini ${modelId} failed: ${err.message}`);
    }
  }

  // If we reach here, it means all models failed on this key
  if (lastError?.message.includes('429') || lastError?.message.includes('QUOTA') || lastError?.message.includes('API_ERROR_429')) {
    if (retryCount < apiKeys.length - 1) {
      console.warn(`🔄 Key ${retryCount + 1} exhausted. Trying next key...`);
      return generateJsonGemini(prompt, retryCount + 1);
    }
    throw new Error('QUOTA_EXHAUSTED_ALL_KEYS');
  }

  throw lastError || new Error('All Gemini models failed on current key');
};
