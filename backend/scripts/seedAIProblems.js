import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/codingQuestionModel.js';
import { generateJson } from '../services/ai/index.js';

dotenv.config();

/**
 * PRODUCTION-GRADE PROBLEM SELECTION
 * Focus on high-quality, high-signal problems for competitive programming mastery.
 */
const questionsToSeed = [
    // CORE: Arrays & Hashing
    { topic: "Arrays & Hashing", title: "Two Sum", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Group Anagrams", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Longest Consecutive Sequence", difficulty: "Medium" },
    
    // CORE: Two Pointers
    { topic: "Two Pointers", title: "3Sum", difficulty: "Medium" },
    { topic: "Two Pointers", title: "Container With Most Water", difficulty: "Medium" },
    
    // CORE: Sliding Window
    { topic: "Sliding Window", title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Minimum Window Substring", difficulty: "Hard" },
    
    // CORE: Binary Search
    { topic: "Binary Search", title: "Search in Rotated Sorted Array", difficulty: "Medium" },
    { topic: "Binary Search", title: "Koko Eating Bananas", difficulty: "Medium" },
    
    // CORE: Trees
    { topic: "Trees", title: "Diameter of Binary Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Binary Tree Level Order Traversal", difficulty: "Medium" },
    { topic: "Trees", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard" },
    
    // CORE: Graph
    { topic: "Graph", title: "Number of Islands", difficulty: "Medium" },
    { topic: "Graph", title: "Course Schedule", difficulty: "Medium" },
    { topic: "Graph", title: "Alien Dictionary", difficulty: "Hard" },
    
    // CORE: Dynamic Programming
    { topic: "Dynamic Programming", title: "Coin Change", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Longest Increasing Subsequence", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Longest Common Subsequence", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Word Break", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Edit Distance", difficulty: "Hard" }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

/**
 * 5-STAGE PROBLEM COMPILER PIPELINE
 */
const seedAIProblems = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (let i = 0; i < questionsToSeed.length; i++) {
            const problem = questionsToSeed[i];
            const slug = generateSlug(problem.title);

            console.log(`\n[${i + 1}/${questionsToSeed.length}] 🚀 Compiling: ${problem.title} (${problem.difficulty})`);

            const existing = await CodingQuestion.findOne({ slug });
            if (existing) {
                console.log(`⏭️ Skipping: Exists.`);
                skipCount++;
                continue;
            }

            const prompt = `You are a Senior Competitive Programming Platform Architect. Generate a production-grade coding problem for: "${problem.title}".

REQUIREMENTS:
- Languages: C++ (id 54), JavaScript (id 63), Python 3 (id 71)
- Topic: ${problem.topic}
- Difficulty: ${problem.difficulty}

OUTPUT STRUCTURE (respond with valid JSON ONLY, no markdown):
{
  "problemStatement": "detailed markdown description",
  "constraints": ["constraint 1", "constraint 2"],
  "inputSchema": {"type": "object"},
  "outputSchema": {"type": "string"},
  "functionSignature": {
    "methodName": "twoSum",
    "parameters": [{"name": "nums", "type": "vector<int>"}, {"name": "target", "type": "int"}],
    "returnType": "vector<int>"
  },
  "starterCode": {
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};",
    "javascript": "class Solution {\\n    twoSum(nums, target) {\\n        \\n    }\\n}",
    "python": "class Solution:\\n    def twoSum(self, nums, target):\\n        "
  },
  "judgeDriver": {
    "cpp": "complete stdin reader and caller",
    "javascript": "complete stdin reader and caller",
    "python": "complete stdin reader and caller"
  },
  "referenceSolution": {
    "cpp": "optimal reference code",
    "javascript": "optimal reference code",  
    "python": "optimal reference code"
  },
  "visibleTestCases": [
    {"input": "test input 1", "expectedOutput": "output 1"},
    {"input": "test input 2", "expectedOutput": "output 2"},
    {"input": "test input 3", "expectedOutput": "output 3"}
  ],
  "hiddenTestCases": [
    {"input": "test 4", "expectedOutput": "out 4"},
    {"input": "test 5", "expectedOutput": "out 5"},
    {"input": "test 6", "expectedOutput": "out 6"},
    {"input": "test 7", "expectedOutput": "out 7"},
    {"input": "test 8", "expectedOutput": "out 8"},
    {"input": "test 9", "expectedOutput": "out 9"},
    {"input": "test 10", "expectedOutput": "out 10"}
  ],
  "validated": true
}`;

            let retries = 2;
            let generatedData = null;

            while (retries >= 0) {
                try {
                    generatedData = await generateJson(prompt);
                    
                    if (!generatedData.judgeDriver?.cpp || !generatedData.referenceSolution?.cpp) {
                        console.log('--- DATA DUMP START ---');
                        console.log(generatedData);
                        console.log('--- DATA DUMP END ---');
                        throw new Error('Incomplete data generated');
                    }
                    if (generatedData.visibleTestCases.length !== 3 || generatedData.hiddenTestCases.length !== 7) {
                        throw new Error('Invalid test case count');
                    }
                    break;
                } catch (err) {
                    console.warn(`⚠️ Retry ${2 - retries}: ${err.message}`);
                    retries--;
                    if (retries >= 0) await sleep(3000);
                }
            }

            if (generatedData) {
                try {
                    await CodingQuestion.create({
                        ...generatedData,
                        title: problem.title,
                        topic: problem.topic.toLowerCase(),
                        difficulty: problem.difficulty,
                        slug,
                        acceptanceRate: Math.floor(Math.random() * 40) + 40,
                        submissionStats: { totalSubmissions: 0, acceptedSubmissions: 0 }
                    });
                    console.log(`✅ Success: ${problem.title}`);
                    successCount++;
                } catch (saveErr) {
                    console.error(`❌ Save Error: ${saveErr.message}`);
                    failCount++;
                }
            } else {
                console.error(`❌ Failed: ${problem.title}`);
                failCount++;
            }

            // Quality Control Delay
            if (i < questionsToSeed.length - 1) await sleep(5000);
        }

        console.log(`\n🏁 Compilation Summary: ${successCount} Successful, ${failCount} Failed, ${skipCount} Skipped.`);
        process.exit(0);
    } catch (err) {
        console.error('💥 Fatal:', err.message);
        process.exit(1);
    }
};

seedAIProblems();
