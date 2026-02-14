// Feature Functions with AI Integration
// Imports generateJson from unified AI service
// Includes all demo fallback modes for development

import { generateJson } from './ai/index.js';
import { getResourcesForTopic } from './resourceDatabase.js';
import { searchYouTubeVideos } from './youtubeService.js';

export const generateRoadmapFromAI = async (topic) => {
  try {
    // 1. Get verified resources for the main topic if available
    const verifiedResources = getResourcesForTopic(topic);

    const prompt = `
      You are a World-Class Educational Architect.
      Generate a MASTERCLASS roadmap for: "${topic}".
      
      CURRICULUM RULES:
      1. STRUCTURE: 8 strictly progressive modules.
      2. RICH DETAIL: 
         - "description": 3-4 professional sentences focusing on technical depth.
         - "objectives": 4-5 high-level technical outcomes.
         - "keyConcepts": 5-6 granular technical terms.
      3. REAL RESOURCES:
         - Provide REAL URLs to official documentation. 
         - Examples of REAL sites: huggingface.co/docs, pytorch.org/docs, react.dev, geeksforgeeks.org, developer.mozilla.org, learn.microsoft.com, aws.amazon.com/docs.
         - If unsure, provide the resource name in 'title' and I will find it.

      JSON STRUCTURE:
      {
        "title": "Mastering ${topic}",
        "description": "Comprehensive summary.",
        "difficulty": (string),
        "totalDuration": (string),
        "modules": [
          {
            "title": (string),
            "description": (string),
            "objectives": [(string)],
            "keyConcepts": [(string)],
            "estimatedTime": (string),
            "suggestedResources": [
               { "title": "Official Doc: [Topic]", "url": "https://...", "type": "doc" }
            ]
          }
        ]
      }
      Respond ONLY with valid JSON.
    `;
    
    const roadmap = await generateJson(prompt);
    
    if (roadmap.modules && Array.isArray(roadmap.modules)) {
      roadmap.modules = roadmap.modules.slice(0, 8);

      const modulesWithVideos = await Promise.all(roadmap.modules.map(async (module, index) => {
        let videos = [];
        try {
          // PRECISION SEARCH: Use module title + first 2 key concepts to anchor the results
          const concepts = (module.keyConcepts || []).slice(0, 2).join(' ');
          const searchQuery = `${module.title} ${concepts} technical tutorial`.trim();
          videos = await searchYouTubeVideos(searchQuery, 6);
        } catch (err) {
          console.warn(`⚠️ Video fetch failed for module ${index+1}`);
        }
        
        const extraResources = index === 0 ? verifiedResources.slice(0, 3) : [];
        
        // Trusted domains for validation
        const trustedDomains = [
          'huggingface.co', 'pytorch.org', 'react.dev', 'geeksforgeeks.org', 
          'developer.mozilla.org', 'wikipedia.org', 'stackoverflow.com', 
          'github.com', 'w3schools.com', 'learn.microsoft.com', 'aws.amazon.com',
          'google.com/docs', 'openai.com', 'langchain.com'
        ];

        // Sanitize & Force Realistic Documentation Links
        const sanitizedResources = (module.suggestedResources || [])
          .filter(r => r && (typeof r === 'object' || typeof r === 'string'))
          .map(r => {
            const allowedTypes = ['video', 'article', 'doc', 'challenge'];
            let title = typeof r === 'string' ? r : (r.title || 'Official Documentation');
            let url = typeof r === 'string' ? '' : (r.url || '');
            let type = (r.type || 'doc').toLowerCase();
            if (!allowedTypes.includes(type)) type = 'article';

            // IF URL IS DUMMY OR UNTRUSTED -> Use a Scoped Search (Much better UX)
            const isTrusted = trustedDomains.some(domain => url.toLowerCase().includes(domain));
            
            if (!url || !url.startsWith('http') || !isTrusted) {
               // Pick the best site based on the topic
               let site = '';
               const lowTitle = (title + ' ' + topic).toLowerCase();
               if (lowTitle.includes('data structure') || lowTitle.includes('algorithm') || lowTitle.includes('dsa')) site = 'geeksforgeeks.org';
               else if (lowTitle.includes('llm') || lowTitle.includes('nlp') || lowTitle.includes('transformer')) site = 'huggingface.co';
               else if (lowTitle.includes('react') || lowTitle.includes('frontend')) site = 'react.dev';
               else if (lowTitle.includes('js') || lowTitle.includes('javascript') || lowTitle.includes('html')) site = 'developer.mozilla.org';
               else if (lowTitle.includes('python')) site = 'docs.python.org';
               
               const searchQuery = site ? `site:${site} ${title}` : `${title} official documentation`;
               url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            }

            return { title, url, type };
          });

        return {
          ...module,
          resources: [
            ...sanitizedResources,
            ...extraResources,
            ...videos
          ]
        };
      }));

      roadmap.modules = modulesWithVideos;
    }
    
    return roadmap;
  } catch (error) {
    console.error(`❌ Roadmap Generation Error:`, error.message);
    throw error;
  }
};


export const generateQuizFromAI = async (moduleTitle, topic, knowledgeContext = '') => {
  // Try real API with key rotation
  try {
    const prompt = `
      You are an expert assessment designer. 
      Generate a 10-question multiple-choice quiz for the topic "${moduleTitle}" within the broader subject of "${topic}".
      
      ${knowledgeContext ? `
      GROUNDING SOURCE MATERIAL:
      The following content is from our official expert-verified knowledge base. 
      PLEASE generate at least 7 of the 10 questions STRICTLY BASED on the information provided below.
      
      """
      ${knowledgeContext}
      """
      ` : ''}

      QUIZ RULES:
      1. Ensure questions cover technical nuances, common pitfalls, and core principles.
      2. Each question must have 4 distinct options.
      3. One option must be clearly correct.

      Respond with a JSON object containing a single key "questions".
      "questions" should be an array of objects. Each object must have:
      1. "question" (string): The text of the question.
      2. "options" (array of strings): An array of 4 possible answers.
      3. "correctAnswer" (string): The string of the correct answer, which must be one of the strings from the "options" array.
    `;
    return await generateJson(prompt);
  } catch (error) {
    console.warn(`⚠️  Real AI API failed for quiz (${moduleTitle}):`, error.message);
  }

  // Demo mode - return structured sample quiz
  console.log('❌ Using DEMO mode for quiz generation (No API keys available)');
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
  // Try real API
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
    console.warn(`🔄 Falling back to demo mode for recommendations`);
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
  // Try real API
  try {
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
    return await generateJson(prompt);
  } catch (error) {
    console.warn(`🔄 Falling back to demo mode for articles (${topic})`);
  }

  // Demo mode - return structured sample articles
  return {
    resources: [
      {
        title: `Official ${topic} Documentation`,
        url: `https://docs.example.com/${topic.toLowerCase()}`,
        description: `The official documentation for ${topic}. Covers all fundamental concepts and best practices.`,
        type: 'doc'
      },
      {
        title: `${topic} Tutorial Guide`,
        url: `https://tutorial.example.com/${topic.toLowerCase()}`,
        description: `Comprehensive tutorial guide with step-by-step examples for learning ${topic}.`,
        type: 'article'
      },
      {
        title: `Advanced ${topic} Concepts`,
        url: `https://advanced.example.com/${topic.toLowerCase()}`,
        description: `In-depth guide covering advanced patterns and techniques in ${topic}.`,
        type: 'article'
      }
    ]
  };
};


export const generateRoadmapFromRAG = async (topic, context) => {
  try {
    const prompt = `
      You are an elite educational architect specializing in Curriculum Extracting.
      Below are excerpts from a user's study material regarding "${topic}".
      
      CONTEXT FROM STUDY MATERIAL:
      """
      ${context}
      """
      
      TASK:
      Generate a MASTERCLASS roadmap based on this SPECIFIC context.
      
      CURRICULUM RULES:
      1. STRUCTURE: 7-10 progressive modules based exclusively on the context.
      2. RICH DETAIL: 
         - "description": 3-4 detailed sentences explaining the core concepts found in the text.
         - "objectives": 4-5 outcomes extracted from the context.
         - "keyConcepts": 5-6 terms found in the context.
      3. REAL RESOURCES:
         - Provide REAL URLs to official documentation or primary sites related to these specific concepts.

      JSON STRUCTURE:
      {
        "title": (string),
        "description": (string),
        "difficulty": (string),
        "modules": [
          {
            "title": (string),
            "description": (string),
            "objectives": [(string)],
            "keyConcepts": [(string)],
            "estimatedTime": (string),
            "suggestedResources": []
          }
        ]
      }
      
      Respond ONLY with JSON.
    `;
    
    const roadmap = await generateJson(prompt);

    if (roadmap.modules && Array.isArray(roadmap.modules)) {
      roadmap.modules = await Promise.all(roadmap.modules.map(async (module, index) => {
        // Fetch 5 high-quality videos/playlists per module
        let videos = [];
        try {
          videos = await searchYouTubeVideos(`${topic} ${module.title} tutorial`, 5);
        } catch (err) {
          console.warn(`⚠️ Video fetch failed for RAG module ${index+1}`);
        }
        
        // Sanitize suggested resources
        const sanitizedSuggested = (module.suggestedResources || [])
          .filter(r => r && (typeof r === 'object' || typeof r === 'string'))
          .map(r => {
            const allowedTypes = ['video', 'article', 'doc', 'challenge'];
            if (typeof r === 'string') {
              return { title: r, url: 'https://www.google.com/search?q=' + encodeURIComponent(r + ' documentation'), type: 'doc' };
            }

            // Map AI-provided type to allowed enum values
            let type = (r.type || 'doc').toLowerCase();
            if (!allowedTypes.includes(type)) {
              if (type.includes('tutorial') || type.includes('guide')) type = 'article';
              else if (type.includes('video') || type.includes('youtube')) type = 'video';
              else type = 'doc';
            }

            return {
              title: r.title || 'Resource',
              url: r.url && r.url.startsWith('http') ? r.url : 'https://www.google.com/search?q=' + encodeURIComponent((r.title || module.title) + ' documentation'),
              type: type
            };
          });

        return {
          ...module,
          resources: [
            ...sanitizedSuggested,
            ...videos
          ]
        };
      }));
    }

    return roadmap;
  } catch (error) {
    console.error(`❌ RAG Roadmap Generation Error: ${error.message}`);
    return generateRoadmapFromAI(topic); 
  }
};
