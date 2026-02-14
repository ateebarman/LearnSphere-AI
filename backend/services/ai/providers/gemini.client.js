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
    console.log(`✅ Gemini Service initialized with ${apiKeys.length} keys (Model: 1.5 Pro)`);
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
    let fixed = jsonCandidate
      .replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
      .replace(/[\u201C\u201D]/g, '"'); // fix "smart" quotes
      
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

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${currentKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.6,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096 
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      }
    );

    const data = await res.json();

    // Check for quota exhaustion
    if (res.status === 429 || data.error?.code === 429) {
      throw new Error('QUOTA_EXHAUSTED');
    }

    if (!res.ok) {
      console.error(`Gemini API error (${res.status}):`, data.error?.message || 'Unknown error');
      throw new Error(`API_ERROR_${res.status}`);
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    if (!text) throw new Error('Empty Gemini response');

    return extractJSON(text);
  } catch (error) {
    // Failover to next key if quota exhausted or rate limited
    if ((error.message === 'QUOTA_EXHAUSTED' || error.message.includes('429')) && retryCount < apiKeys.length - 1) {
      console.warn(`🔄 Gemini key rate-limited. Retrying with next key... (${retryCount + 1}/${apiKeys.length})`);
      return generateJsonGemini(prompt, retryCount + 1);
    }

    if (error.message === 'QUOTA_EXHAUSTED') {
      console.warn('⚠️  All Gemini keys rate-limited — switching provider or demo mode');
    } else {
      console.warn(`⚠️  Gemini API failed:`, error.message);
    }
    throw error;
  }
};
