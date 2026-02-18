import { generateJson } from './ai/index.js';

/**
 * Generates a high-quality coding question using AI with LeetCode-style structure.
 */
const generateStarterCode = (signature) => {
  const { methodName, parameters, returnType } = signature;
  
  const typeMap = {
    cpp: {
      'integer': 'int',
      'int': 'int',
      'string': 'string',
      'array': 'vector<int>&',
      'boolean': 'bool',
      'ListNode*': 'ListNode*',
      'TreeNode*': 'TreeNode*',
      'vector<int>': 'vector<int>',
      'vector<int>&': 'vector<int>&',
      'vector<vector<int>>': 'vector<vector<int>>'
    }
  };

  const getCppType = (t) => {
    if (!t) return 'void';
    const lowT = t.toLowerCase();
    return typeMap.cpp[lowT] || typeMap.cpp[t] || t;
  };

  // Format parameters
  const cppParams = parameters.map(p => `${getCppType(p.type)} ${p.name}`).join(', ');
  const jsParams = parameters.map(p => p.name).join(', ');
  const pyParams = parameters.map(p => p.name).join(', ');

  return {
    cpp: `class Solution {\npublic:\n    ${getCppType(returnType)} ${methodName}(${cppParams}) {\n        \n    }\n};`,
    javascript: `class Solution {\n    ${methodName}(${jsParams}) {\n        \n    }\n}`,
    python: `class Solution:\n    def ${methodName}(self, ${pyParams}):\n        \n`
  };
};

export const generateCodingQuestionFromAI = async (topic) => {
  const prompt = `
    You are a Senior Competitive Programming Platform Architect. 
    Execute a deterministic 5-stage pipeline for: "${topic}".

    LANGUAGES: C++ (GCC id 54), JavaScript (NodeJS id 63), Python 3 (id 71).
    
    PIPELINE:
    1. SPEC: Define title, Markdown problemStatement (professional), constraints, inputSchema, outputSchema.
    2. REF SOLUTIONS: Optimal logic-only referenceSolution for each language.
    3. TESTS: 3 visible, 7 hidden test cases (logically verified).
    4. METADATA: 
       - generate functionSignature: { methodName, parameters: [{name, type}], returnType }.
       - generate robust judgeDriver for each language (STDIN -> Solution -> STDOUT).
    5. VALIDATION: Ensure 100% deterministic cross-language execution.

    STRUCTURE:
    {
      "title": (string),
      "slug": (string),
      "difficulty": "Easy" | "Medium" | "Hard",
      "problemStatement": (markdown - description only, NO examples),
      "constraints": [(strings)],
      "examples": [
        {
          "input": (string),
          "output": (string),
          "explanation": (string)
        }
      ],
      "inputSchema": (object),
      "outputSchema": (object),
      "functionSignature": {
         "methodName": (string),
         "parameters": [{ "name": (string), "type": (string) }],
         "returnType": (string)
      },
      "judgeDriver": { "javascript": (string), "python": (string), "cpp": (string) },
      "referenceSolution": { "javascript": (string), "python": (string), "cpp": (string) },
      "visibleTestCases": [ { "input": (string), "expectedOutput": (string) } ],
      "hiddenTestCases": [ { "input": (string), "expectedOutput": (string) } ],
      "validated": true
    }
  `;

  try {
    const questionData = await generateJson(prompt);
    
    // Stage 4 Fallback: Generate Platform-Controlled Starter Code
    if (questionData.functionSignature) {
      questionData.starterCode = generateStarterCode(questionData.functionSignature);
    }

    const requiredFields = ['title', 'problemStatement', 'judgeDriver', 'referenceSolution', 'visibleTestCases', 'hiddenTestCases', 'starterCode'];
    for (const field of requiredFields) {
      if (!questionData[field]) {
        throw new Error(`AI produced incomplete data: missing ${field}`);
      }
    }
    
    return questionData;
  } catch (error) {
    console.error('AI Problem Generation Error:', error.message);
    throw new Error('Failed to generate high-quality coding question');
  }
};
