import { generateJsonGroq } from './ai/providers/groq.client.js';
import { generateJsonGemini } from './ai/providers/gemini.client.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

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
              model: options.model || 'llama-3.3-70b-versatile',
              messages: options.messages,
              temperature: options.temperature || 0.7,
              max_tokens: options.maxTokens || 800
            })
          });
          const data = await res.json();
          if (res.ok && data.choices?.[0]?.message) {
            return { text: data.choices[0].message.content };
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
      const json = await generateJsonGroq(prompt);
      return { text: typeof json === 'string' ? json : JSON.stringify(json), json };
    } catch (err) {
      const json = await generateJsonGemini(prompt);
      return { text: typeof json === 'string' ? json : JSON.stringify(json), json };
    }
  }

  async generateStream(options, onChunk) {
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
            model: options.model || 'llama-3.3-70b-versatile',
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

    try {
      return await generateJsonGroq(prompt);
    } catch (err) {
      return await generateJsonGemini(prompt);
    }
  }
}

export const aiService = new AIService();
