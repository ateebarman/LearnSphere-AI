import { generateJsonGroq } from './ai/providers/groq.client.js';
import { generateJsonGemini } from './ai/providers/gemini.client.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

const sanitizeGroqModel = (model) => {
  if (!model || typeof model !== 'string') return DEFAULT_MODEL;
  const m = model.trim().toLowerCase();
  if (m.includes('llama') || m.includes('mixtral') || m.includes('gemma')) {
    return DEFAULT_MODEL;
  }
  return model.trim();
};

const getGroqKeys = () => {
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GROQ_API_KEY${i}`] || process.env.GROQ_API_KEY;
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
};

let groqKeyIndex = 0;

export class AIService {
  async generateResponse(options) {
    const selectedModel = sanitizeGroqModel(options.model || process.env.GROQ_MODEL);

    try {
      if (options.messages && Array.isArray(options.messages)) {
        const keys = getGroqKeys();
        if (keys.length > 0) {
          const key = keys[groqKeyIndex % keys.length];
          groqKeyIndex++;
          const res = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: options.messages,
              temperature: options.temperature || 0.7,
              max_tokens: options.maxTokens || 800
            })
          });
          const data = await res.json();
          if (res.ok && data.choices?.[0]?.message) {
            return { text: data.choices[0].message.content };
          }
          // If primary model failed (404, 400, 429, etc.), try 20b fallback
          if (!res.ok) {
            console.warn(`⚠️ AIService primary model failed (${res.status}). Retrying with fallback model ${FALLBACK_MODEL}...`);
            const fallbackRes = await fetch(GROQ_ENDPOINT, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: FALLBACK_MODEL,
                messages: options.messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 800
              })
            });
            const fallbackData = await fallbackRes.json();
            if (fallbackRes.ok && fallbackData.choices?.[0]?.message) {
              return { text: fallbackData.choices[0].message.content };
            }
          }
        }
      }
    } catch (e) {
      console.warn('AIService fetch warning:', e.message);
    }
    
    // Fallback to unified generateJson
    const prompt = Array.isArray(options.messages) 
      ? options.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      : String(options.prompt || '');
      
    try {
      const json = await generateJsonGroq(prompt, selectedModel);
      return { text: typeof json === 'string' ? json : JSON.stringify(json), json };
    } catch (err) {
      const json = await generateJsonGemini(prompt);
      return { text: typeof json === 'string' ? json : JSON.stringify(json), json };
    }
  }

  async generateStream(options, onChunk) {
    const selectedModel = sanitizeGroqModel(options.model || process.env.GROQ_MODEL);

    try {
      const keys = getGroqKeys();
      if (keys.length > 0) {
        const key = keys[groqKeyIndex % keys.length];
        groqKeyIndex++;
        const res = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: options.messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 600,
            stream: true
          })
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') {
                  onChunk({ content: '', isDone: true });
                  return;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    onChunk({ content: delta, isDone: false });
                  }
                } catch (e) {}
              }
            }
          }
          onChunk({ content: '', isDone: true });
          return;
        }
      }
    } catch (err) {
      console.warn('Stream failed, executing non-stream fallback:', err.message);
    }

    // Non-streaming fallback
    const res = await this.generateResponse(options);
    onChunk({ content: res.text, isDone: false });
    onChunk({ content: '', isDone: true });
  }

  async generateStructuredResponse(options) {
    const prompt = Array.isArray(options.messages) 
      ? options.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      : String(options.prompt || '');

    const selectedModel = sanitizeGroqModel(options.model || process.env.GROQ_MODEL);

    try {
      return await generateJsonGroq(prompt, selectedModel);
    } catch (err) {
      return await generateJsonGemini(prompt);
    }
  }
}

export const aiService = new AIService();
