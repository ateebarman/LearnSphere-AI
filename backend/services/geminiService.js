const generateJson = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const fullPrompt = `${prompt}. You must respond with only a valid JSON object. Do not include \`\`\`json or any other wrappers in your response.`;
  
  try {
    // Try multiple endpoints in order of preference
    // Using models that are available in the free tier
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`,
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          lastError = new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
          continue;
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          lastError = new Error('Invalid response structure from Gemini API');
          continue;
        }

        let text = data.candidates[0].content.parts[0].text;
        
        try {
          // Clean markdown code blocks if present
          text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
          return JSON.parse(text);
        } catch (e) {
          console.error("Gemini response was not valid JSON:", text);
          // Try removing backticks more aggressively
          text = text.replace(/```/g, '').trim();
          try {
            return JSON.parse(text);
          } catch (e2) {
            lastError = new Error("Failed to parse AI response: " + text.substring(0, 200));
            continue;
          }
        }
      } catch (e) {
        lastError = e;
      }
    }

    // If all endpoints fail, throw the last error
    throw lastError || new Error('All Gemini API endpoints failed');
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    throw error;
  }
};

export const generateRoadmapFromAI = async (topic) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Try real API if key exists
  if (apiKey) {
    try {
      const prompt = `
        Generate a personalized learning roadmap for the topic: "${topic}".
        The roadmap should be structured as a JSON object with a "title", "description", and an array named "modules".
        Each module in the "modules" array should be an object with:
        1. "title" (string): The name of the module (e.g., "Introduction to React").
        2. "description" (string): A short 1-2 sentence description of what the module covers.
        3. "estimatedTime" (string): A string representing the estimated time (e.g., "3 hours", "1 week").
        4. "resources" (array): An array of 3-5 objects, each with a "title" (e.g., "Official React Docs") and "type" ("doc", "article", or "challenge"). Do NOT include video resources, as we will fetch those separately.
        
        Example for "title": "Learning ${topic}"
      `;
      return await generateJson(prompt);
    } catch (error) {
      console.warn('Real Gemini API failed, falling back to demo mode:', error.message);
    }
  }

  // Demo mode - return structured sample data
  console.log('Using DEMO mode for roadmap generation (API key not configured)');
  const demoRoadmaps = {
    'react': {
      title: `Learning ${topic}`,
      description: `A comprehensive learning path for mastering ${topic}`,
      modules: [
        {
          title: 'Introduction to React',
          description: 'Learn the basics of React including JSX, components, and props.',
          estimatedTime: '3 hours',
          resources: [
            { title: 'Official React Documentation', type: 'doc', url: 'https://react.dev' },
            { title: 'React Basics Article', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started' }
          ]
        },
        {
          title: 'State and Props',
          description: 'Master the fundamental concepts of state management and component props.',
          estimatedTime: '4 hours',
          resources: [
            { title: 'React State & Props Guide', type: 'doc', url: 'https://react.dev/learn/passing-props-to-a-component' },
            { title: 'Managing State Tutorial', type: 'article', url: 'https://react.dev/learn/state-a-components-memory' }
          ]
        },
        {
          title: 'React Hooks',
          description: 'Understand useState, useEffect, and custom hooks for functional components.',
          estimatedTime: '5 hours',
          resources: [
            { title: 'Hooks API Reference', type: 'doc', url: 'https://react.dev/reference/react/hooks' },
            { title: 'Building Your Own Hooks', type: 'article', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }
          ]
        }
      ]
    },
    'javascript': {
      title: `Learning ${topic}`,
      description: `A comprehensive learning path for mastering ${topic}`,
      modules: [
        {
          title: 'JavaScript Fundamentals',
          description: 'Master variables, types, operators, and control flow in JavaScript.',
          estimatedTime: '6 hours',
          resources: [
            { title: 'JavaScript.info Guide', type: 'doc', url: 'https://javascript.info/' },
            { title: 'MDN JavaScript Tutorial', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }
          ]
        },
        {
          title: 'Functions and Scope',
          description: 'Learn about functions, closures, and scope management.',
          estimatedTime: '4 hours',
          resources: [
            { title: 'Functions Documentation', type: 'doc', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
            { title: 'JavaScript Closures Explained', type: 'article', url: 'https://javascript.info/closure' }
          ]
        }
      ]
    },
    'default': {
      title: `Learning ${topic}`,
      description: `A personalized learning roadmap for ${topic}`,
      modules: [
        {
          title: `Introduction to ${topic}`,
          description: `Get started with the fundamentals of ${topic}.`,
          estimatedTime: '4 hours',
          resources: [
            { title: `${topic} Official Documentation`, type: 'doc', url: 'https://developer.mozilla.org/' },
            { title: `${topic} Getting Started Guide`, type: 'article', url: 'https://developer.mozilla.org/' }
          ]
        },
        {
          title: `Intermediate ${topic} Concepts`,
          description: `Build on your knowledge with intermediate topics and best practices.`,
          estimatedTime: '6 hours',
          resources: [
            { title: `Advanced ${topic} Patterns`, type: 'article', url: 'https://developer.mozilla.org/' },
            { title: `${topic} Best Practices`, type: 'doc', url: 'https://developer.mozilla.org/' }
          ]
        },
        {
          title: `${topic} Projects and Practice`,
          description: `Apply your knowledge through hands-on projects and challenges.`,
          estimatedTime: '8 hours',
          resources: [
            { title: `Build a Project with ${topic}`, type: 'article', url: 'https://developer.mozilla.org/' },
            { title: `${topic} Coding Challenges`, type: 'challenge', url: 'https://developer.mozilla.org/' }
          ]
        }
      ]
    }
  };

  // Return demo data based on topic
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('react')) {
    return demoRoadmaps.react;
  } else if (topicLower.includes('javascript') || topicLower.includes('js')) {
    return demoRoadmaps.javascript;
  }
  return demoRoadmaps.default;
};

export const generateQuizFromAI = async (moduleTitle, topic) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Try real API if key exists
  if (apiKey) {
    try {
      const prompt = `
        Generate a 10-question multiple-choice quiz for the topic "${moduleTitle}" within the broader subject of "${topic}".
        Respond with a JSON object containing a single key "questions".
        "questions" should be an array of objects. Each object must have:
        1. "question" (string): The text of the question.
        2. "options" (array of strings): An array of 4 possible answers.
        3. "correctAnswer" (string): The string of the correct answer, which must be one of the strings from the "options" array.

        Example:
        {
          "questions": [
            {
              "question": "What is React?",
              "options": ["A library", "A framework", "A language", "A database"],
              "correctAnswer": "A library"
            }
          ]
        }
      `;
      return await generateJson(prompt);
    } catch (error) {
      console.warn('Real Gemini API failed for quiz, using demo mode:', error.message);
    }
  }

  // Demo mode - return structured sample quiz
  console.log('Using DEMO mode for quiz generation (API key not configured)');
  return {
    questions: [
      {
        question: `What is the main purpose of ${moduleTitle}?`,
        options: [
          `Understanding core concepts of ${moduleTitle}`,
          'Only for beginners',
          'A programming language',
          'A database tool'
        ],
        correctAnswer: `Understanding core concepts of ${moduleTitle}`
      },
      {
        question: `Which of the following is a key feature of ${moduleTitle}?`,
        options: [
          'Reusable components',
          'Static content only',
          'No learning curve',
          'Requires no practice'
        ],
        correctAnswer: 'Reusable components'
      },
      {
        question: `How would you best describe ${moduleTitle}?`,
        options: [
          'A modern approach to development',
          'An outdated technology',
          'Only for large companies',
          'Has no real applications'
        ],
        correctAnswer: 'A modern approach to development'
      },
      {
        question: `What is required to master ${moduleTitle}?`,
        options: [
          'Consistent practice and study',
          'Just reading documentation once',
          'No practice needed',
          'Expensive courses only'
        ],
        correctAnswer: 'Consistent practice and study'
      },
      {
        question: `In ${moduleTitle}, what does best practice refer to?`,
        options: [
          'Established patterns and conventions',
          'The hardest possible approach',
          'Doing things randomly',
          'Ignoring documentation'
        ],
        correctAnswer: 'Established patterns and conventions'
      },
      {
        question: `When learning ${moduleTitle}, what should you prioritize?`,
        options: [
          'Understanding fundamentals first',
          'Advanced topics immediately',
          'Skipping documentation',
          'Memorization over understanding'
        ],
        correctAnswer: 'Understanding fundamentals first'
      },
      {
        question: `How does ${moduleTitle} improve your development skills?`,
        options: [
          'By teaching you structured problem-solving',
          'It makes coding unnecessary',
          'Only for entertainment',
          'Has no real benefit'
        ],
        correctAnswer: 'By teaching you structured problem-solving'
      },
      {
        question: `What is a common challenge when learning ${moduleTitle}?`,
        options: [
          'Bridging theory and practical application',
          'Reading too much',
          'Practicing too much',
          'Learning nothing at all'
        ],
        correctAnswer: 'Bridging theory and practical application'
      },
      {
        question: `Which approach works best for ${moduleTitle}?`,
        options: [
          'Learn by building projects',
          'Never build anything',
          'Only watch videos',
          'Ignore examples'
        ],
        correctAnswer: 'Learn by building projects'
      },
      {
        question: `After completing ${moduleTitle}, what\'s the next step?`,
        options: [
          'Apply knowledge in real projects',
          'Stop learning entirely',
          'Move to unrelated topics',
          'Forget what you learned'
        ],
        correctAnswer: 'Apply knowledge in real projects'
      }
    ]
  };
};

export const getRecommendationsFromAI = async (moduleTitle, score, incorrectAnswers) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Try real API first
  if (apiKey && process.env.USE_REAL_GEMINI === 'true') {
    try {
      const prompt = `
        A user just scored ${score}% on a quiz about "${moduleTitle}".
        Their incorrect answers were on these topics: ${incorrectAnswers.join(', ')}.
        
        Generate a short, encouraging feedback message and personalized recommendations.
        If the score is < 70%, suggest specific resources or concepts to review based on the incorrect answers.
        If the score is > 90%, congratulate them and suggest they move on or explore an advanced related topic.
        
        Respond with a JSON object with one key: "feedback".
        
        Example:
        {
          "feedback": "Great job on the quiz! You scored ${score}%. You seem to have a good grasp, but try reviewing ${incorrectAnswers[0]}... Here is a good article: [link]"
        }
      `;
      return await generateJson(prompt);
    } catch (error) {
      console.warn('Real Gemini API failed for recommendations, using demo mode');
    }
  }

  // Demo mode
  let feedback = '';
  if (score < 70) {
    feedback = `You scored ${score}% on the ${moduleTitle} quiz. Keep practicing! ${
      incorrectAnswers.length > 0
        ? `Focus on reviewing these topics: ${incorrectAnswers.join(', ')}. `
        : ''
    }Check out the recommended resources in your roadmap and try the quiz again soon.`;
  } else if (score < 90) {
    feedback = `Great job! You scored ${score}% on the ${moduleTitle} quiz. You're on the right track! ${
      incorrectAnswers.length > 0
        ? `Try reviewing these areas to improve: ${incorrectAnswers.join(', ')}.`
        : ''
    } Keep up the good work!`;
  } else {
    feedback = `Excellent! You scored ${score}% on the ${moduleTitle} quiz. Outstanding performance! You've mastered this module. Consider exploring advanced topics or helping others learn.`;
  }

  return { feedback };
};

export const getArticlesFromAI = async (topic) => {
   const prompt = `
    Find 3 high-quality articles or documentation links for learning about "${topic}".
    Respond with a JSON object with a key "resources".
    "resources" should be an array of objects, each with "title", "url", "description", and "type" (set to "article" or "doc").
    
    Example:
    {
      "resources": [
        {
          "title": "MDN Docs: ${topic}",
          "url": "https://developer.mozilla.org/...",
          "description": "The official MDN documentation.",
          "type": "doc"
        }
      ]
    }
  `;
  return generateJson(prompt);
};