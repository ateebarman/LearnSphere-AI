import axios from 'axios';

const SYSTEM_PROMPT = `You are a friendly and expert personal coding tutor with deep knowledge in web development, programming, data structures, algorithms, and software engineering best practices.

Guidelines:
1. Provide step-by-step explanations when teaching concepts
2. Use code examples whenever relevant
3. If a question is vague, ask one clarifying follow-up question
4. Keep answers concise but thorough and helpful
5. Use Markdown formatting for code blocks and emphasis
6. Be encouraging and patient
7. Explain the "why" behind concepts, not just the "how"
8. When showing code, use proper syntax highlighting with language tags
9. Break down complex topics into digestible pieces
10. Relate new concepts to ones the user might already know

GROUNDING INSTRUCTIONS:
- You will be provided with INTERNAL DOCUMENTATION snippets from our knowledge base when relevant.
- PLEASE PRIORITIZE the information in these snippets as the primary source of truth for technical details and best practices.
- Do not mention that you are reading from snippets; incorporate the information naturally as your own expert knowledge.`;

export const chatWithTutor = async (message, history = [], knowledgeContext = '') => {
  // Read env vars inside function, not at module level
  const TUTOR_GROQ_API_KEY = process.env.TUTOR_GROQ_API_KEY;
  const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    // Preparing the user message with context if available
    const userMessageContent = knowledgeContext 
      ? `CONTEXT FROM OUR KNOWLEDGE BASE:\n${knowledgeContext}\n\nUSER QUESTION: ${message}`
      : message;

    // Input validation
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new Error('Message cannot be empty');
    }

    // Limit history to last 12 messages to prevent payload bloat
    const limitedHistory = history.slice(-12);

    // Prepare messages for Groq API
    const messages = [
      ...limitedHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessageContent,
      },
    ];

    // Call Groq API
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${TUTOR_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract reply from response
    const reply = response.data.choices[0].message.content.trim();

    if (!reply) {
      throw new Error('No response from tutor');
    }

    return reply;
  } catch (error) {
    // Handle specific API errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error('Groq API Error Status:', status);
      console.error('Groq API Error Data:', JSON.stringify(data, null, 2));

      if (status === 401) {
        console.error('Auth Error - TUTOR_GROQ_API_KEY:', TUTOR_GROQ_API_KEY ? 'Present' : 'MISSING');
        throw new Error('Groq API authentication failed. Check TUTOR_GROQ_API_KEY in .env');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (status === 400) {
        throw new Error('Invalid request to Groq API');
      } else {
        throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
      }
    }

    // Handle network or other errors
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to Groq API. Check your network and API configuration.');
    }

    // Re-throw validation errors
    if (error.message === 'Message cannot be empty') {
      throw error;
    }

    throw new Error(`Tutor service error: ${error.message}`);
  }
};
