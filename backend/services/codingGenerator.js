import { generateJson } from './ai/index.js';

/**
 * Generates a high-quality coding question using AI with LeetCode-style structure.
 */
export const generateCodingQuestionFromAI = async (topic) => {
  const prompt = `
    You are an expert Competitive Programming architect (FAANG Tier).
    Generate a HIGH-QUALITY, professional coding challenge for the topic: "${topic}".

    CRITICAL QUALITY REQUIREMENTS:
    1. PROBLEM STATEMENT: 
       - Must be detailed and professional. 
       - Explain the logic clearly, include edge cases, and use proper Markdown formatting.
       - Use LaTeX-style notation for math (e.g., $O(n \log n)$).
    
    2. STARTER CODE (MANDATORY STRUCTURE):
       - DO NOT use one-liners. Use multiple lines and proper indentation (4 spaces).
       - Each language MUST follow this EXACT structure:

       C++:
       class Solution {
       public:
           [RETURN_TYPE] [METHOD_NAME]([PARAMETERS]) {
               
           }
       };

       JavaScript:
       class Solution {
           [METHOD_NAME]([PARAMETERS]) {
               
           }
       }

       Python:
       class Solution:
           def [METHOD_NAME](self, [PARAMETERS]):
               

    3. TEST DRIVER:
       - Must be robust and correctly parse inputs for the specific Solution class.
    
    4. ACCURACY:
       - You MUST manually verify all 10 test cases (3 visible, 7 hidden).
       - Expected outputs must be 100% correct.

    JSON STRUCTURE:
    {
      "title": (string),
      "slug": (url-friendly-slug),
      "difficulty": "Easy" | "Medium" | "Hard",
      "problemStatement": (detailed professional markdown),
      "constraints": [(strings)],
      "examples": [
        { "input": (string), "output": (string), "explanation": (string) }
      ],
      "starterCode": { "javascript": (string), "python": (string), "cpp": (string) },
      "testDriver": { "javascript": (string), "python": (string), "cpp": (string) },
      "visibleTestCases": [ { "input": (string), "expectedOutput": (string) } ],
      "hiddenTestCases": [ { "input": (string), "expectedOutput": (string) } ]
    }

    Respond ONLY with raw JSON.
  `;

  try {
    const questionData = await generateJson(prompt);
    
    if (!questionData.starterCode?.cpp || !questionData.testDriver?.cpp) {
       throw new Error('AI produced incomplete language support');
    }
    
    return questionData;
  } catch (error) {
    console.error('AI Selection Error:', error.message);
    throw new Error('Failed to generate accurate coding question');
  }
};
