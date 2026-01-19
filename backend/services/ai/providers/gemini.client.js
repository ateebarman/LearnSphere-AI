// Gemini API Provider Client
// Single API key, no rotation, single request attempt

let apiKey = null;

export const initializeGemini = () => {
  apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];
  if (apiKey) {
    console.log('✅ Gemini API key loaded');
  } else {
    console.log('⚠️  No Gemini API key found - will use demo mode');
  }
};

const extractJSON = (text) => {
  // Strategy 1: Remove markdown code blocks
  let cleanText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  
  // Strategy 2: Find the first { and last } and extract everything between
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON structure found in response');
  }
  
  let jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
  
  // Strategy 3: Try to fix common issues
  // Fix trailing commas before } or ]
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix single quotes that should be double quotes (but be careful with apostrophes)
  // Only replace quotes that look like they're wrapping keys or values
  jsonStr = jsonStr.replace(/:\s*'([^']*?)'\s*([,}\])])/g, ': "$1"$2');
  
  // Try to parse
  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    // If still failing, try removing all newlines and extra whitespace
    jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    try {
      return JSON.parse(jsonStr);
    } catch (secondError) {
      throw new Error(`JSON parsing failed: ${parseError.message} at position ~${parseError.message.match(/position (\d+)/)?.at(1) || 'unknown'}`);
    }
  }
};

export const generateJsonGemini = async (prompt) => {
  if (!apiKey) {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048  // Reduced from 8192 to lower free-tier pressure
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
    // Log quota exhaustion clearly (once)
    if (error.message === 'QUOTA_EXHAUSTED') {
      console.warn('⚠️  Gemini quota exhausted — switching to DEMO mode');
    } else {
      console.warn(`⚠️  Gemini API failed:`, error.message);
    }
    throw error;
  }
};
