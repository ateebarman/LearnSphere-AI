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

export const generateCodingQuestionFromAI = async (topic, description = '') => {
  const contextPrompt = description ? `\n    CONTEXT/DESCRIPTION: "${description}"\n    INTEGRATE this context into the problem logic.` : '';

    const prompt = `
    You are a Senior Technical Content Engineer at LeetCode. 
    Generate a coding problem for: "${topic}".${contextPrompt}

    ### LANGUAGE RULES:
    - **C++**: Use "int", "long long", "string", "vector<T>". Include <bits/stdc++.h>.
    - **Python**: Use standard type hints (e.g., List[int], str).
    - **JavaScript**: Use standard ES6. No TypeScript types in JS.
    - **FORBIDDEN**: Never use "number" or "number[]" in C++. Never use "require" or "import".

    ### STRUCTURE RULE:
    - Standard Function: class Solution { public: [method] } (CPP), class Solution: def [method] (Python), class Solution { [method] } (JS).

    ### EXAMPLE CODE (FOLLOW THIS PATTERN):
    Topic: "Two Sum"
    {
      "starterCode": {
        "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};"
      },
      "judgeDriver": {
        "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    int n, target;\\n    cin >> n;\\n    vector<int> nums(n);\\n    for(int i=0; i<n; i++) cin >> nums[i];\\n    cin >> target;\\n    Solution sol;\\n    vector<int> res = sol.twoSum(nums, target);\\n    cout << \\"[\\" << res[0] << \\",\\" << res[1] << \\"]\\" << endl;\\n    return 0;\\n}",
        "python": "import sys, json\\nfrom solution import Solution\\nif __name__ == '__main__':\\n    nums = json.loads(sys.stdin.readline())\\n    target = int(sys.stdin.readline())\\n    print(json.dumps(Solution().twoSum(nums, target)))"
      }
    }

    ### FINAL JSON STRUCTURE:
    {
      "title": (string),
      "slug": (string),
      "difficulty": "Easy" | "Medium" | "Hard",
      "problemStatement": (markdown),
      "constraints": [(strings)],
      "examples": [{ "input": (string), "output": (string), "explanation": (string) }],
      "functionSignature": { "methodName": (string), "parameters": [{"name": (string), "type": (string)}], "returnType": (string) },
      "judgeDriver": { "javascript": (string), "python": (string), "cpp": (string) },
      "referenceSolution": { "javascript": (string), "python": (string), "cpp": (string) },
      "starterCode": { "javascript": (string), "python": (string), "cpp": (string) },
      "visibleTestCases": [ { "input": (string), "expectedOutput": (string) } ],
      "hiddenTestCases": [ { "input": (string), "expectedOutput": (string) } ]
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
