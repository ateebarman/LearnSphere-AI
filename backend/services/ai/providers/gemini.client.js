// Gemini API Provider Client
// Single API key, no rotation, single request attempt

let apiKeys = [];
let currentKeyIndex = 0;

// Rate Limiter State
const RPM_LIMIT = 15;
const requestHistory = new Map(); // Key -> Array of timestamps

export const initializeGemini = () => {
  apiKeys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY${i}`];
    if (key) apiKeys.push(key);
  }

  if (apiKeys.length > 0) {
    apiKeys.forEach(key => requestHistory.set(key, []));
    console.log(`✅ Gemini Service initialized with ${apiKeys.length} keys (Rotating across: gemini-flash-latest, 1.5-flash, 2.0-flash)`);
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
      return { key, index };
    }
  }

  // All keys full? Wait 5 seconds and try again
  console.log('⏳ All Gemini keys at RPM limit. Waiting 5s...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  return getNextApiKey();
};

const extractJSON = (text) => {
  // Strategy 1: Direct Parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Strategy 2: Substring
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const candidate = text.substring(firstBrace, lastBrace + 1);
        const fixed = candidate
          .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
          .replace(/[\u201C\u201D]/g, '"') // fix "smart" quotes
          .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, contents) => {
              // Replace raw newlines inside the string contents with escaped \n
              return '"' + contents.replace(/\n/g, '\\n') + '"';
          });
        return JSON.parse(fixed);
      }
    } catch (e2) {
      // Strategy 3: Markdown clean
      let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try { return JSON.parse(cleaned); } catch (e) {}
    }
  }
  throw new Error('Failed to extract valid JSON from Gemini response');
};

export const generateJsonGemini = async (prompt, retryCount = 0) => {
  const result = await getNextApiKey();
  if (!result) {
    throw new Error('No Gemini API key configured');
  }
  const { key: currentKey, index: keyIndex } = result;

  const fullPrompt = `${prompt}

CRITICAL INSTRUCTIONS:
- Respond ONLY with valid JSON.
- If you are generating code strings, ensure all internal quotes are escaped (\") and newlines are escaped (\\n).
- Do NOT wrap in markdown code blocks.`;

  const models = [
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (const modelId of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s timeout

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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

      if (res.status === 429 || data.error?.code === 429) {
        console.warn(`⚠️ Model ${modelId} rate limited on Key ${keyIndex + 1}.`);
        lastError = new Error(`QUOTA_EXHAUSTED: ${data.error?.message}`);
        continue;
      }

      if (!res.ok) {
        throw new Error(`API_ERROR_${res.status}: ${data.error?.message}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from model');
      
      try {
        const result = extractJSON(text);
        console.log(`✅ Success with Gemini ${modelId} using Key ${keyIndex + 1}`);
        return result;
      } catch (e) {
        console.log(`--- RAW GEMINI TEXT (${modelId}) ---`);
        console.log(text);
        console.log('-----------------------');
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`❌ Gemini ${modelId} timed out on Key ${keyIndex + 1}`);
      } else {
        console.warn(`❌ Gemini ${modelId} failed on Key ${keyIndex + 1}: ${err.message}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // If we reach here, all models failed on this key. Try the next key.
  if (retryCount < apiKeys.length - 1) {
    console.warn(`🔄 Key ${keyIndex + 1} failed. Attempting failover to next key...`);
    return generateJsonGemini(prompt, retryCount + 1);
  }

  throw lastError || new Error('All Gemini keys and models failed');
};
