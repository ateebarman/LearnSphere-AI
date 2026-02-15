import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/codingQuestionModel.js';
import { generateJsonGroq } from '../services/ai/providers/groq.client.js';

dotenv.config();

const questionsToSeed = [
    // Arrays & Hashing (20)
    { topic: "Arrays & Hashing", title: "Two Sum", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Contains Duplicate", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Valid Anagram", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Group Anagrams", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Top K Frequent Elements", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Product of Array Except Self", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Encode and Decode Strings", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Longest Consecutive Sequence", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Majority Element", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Move Zeroes", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Best Time to Buy and Sell Stock", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Subarray Sum Equals K", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Maximum Subarray", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Rotate Array", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Merge Sorted Array", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Intersection of Two Arrays", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Missing Number", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Find All Numbers Disappeared in an Array", difficulty: "Easy" },
    { topic: "Arrays & Hashing", title: "Set Matrix Zeroes", difficulty: "Medium" },
    { topic: "Arrays & Hashing", title: "Spiral Matrix", difficulty: "Medium" },

    // Two Pointers (10)
    { topic: "Two Pointers", title: "Valid Palindrome", difficulty: "Easy" },
    { topic: "Two Pointers", title: "Two Sum II – Input Array Is Sorted", difficulty: "Medium" },
    { topic: "Two Pointers", title: "3Sum", difficulty: "Medium" },
    { topic: "Two Pointers", title: "Container With Most Water", difficulty: "Medium" },
    { topic: "Two Pointers", title: "Trapping Rain Water", difficulty: "Hard" },
    { topic: "Two Pointers", title: "Remove Duplicates from Sorted Array", difficulty: "Easy" },
    { topic: "Two Pointers", title: "Squares of a Sorted Array", difficulty: "Easy" },
    { topic: "Two Pointers", title: "Reverse String", difficulty: "Easy" },
    { topic: "Two Pointers", title: "Backspace String Compare", difficulty: "Easy" },
    { topic: "Two Pointers", title: "Sort Colors", difficulty: "Medium" },

    // Sliding Window (10)
    { topic: "Sliding Window", title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Longest Repeating Character Replacement", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Minimum Window Substring", difficulty: "Hard" },
    { topic: "Sliding Window", title: "Permutation in String", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Find All Anagrams in a String", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Sliding Window Maximum", difficulty: "Hard" },
    { topic: "Sliding Window", title: "Fruit Into Baskets", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Maximum Average Subarray I", difficulty: "Easy" },
    { topic: "Sliding Window", title: "Subarray Product Less Than K", difficulty: "Medium" },
    { topic: "Sliding Window", title: "Longest Subarray of 1s After Deleting One Element", difficulty: "Medium" },

    // Stack (10)
    { topic: "Stack", title: "Valid Parentheses", difficulty: "Easy" },
    { topic: "Stack", title: "Min Stack", difficulty: "Medium" },
    { topic: "Stack", title: "Evaluate Reverse Polish Notation", difficulty: "Medium" },
    { topic: "Stack", title: "Daily Temperatures", difficulty: "Medium" },
    { topic: "Stack", title: "Car Fleet", difficulty: "Medium" },
    { topic: "Stack", title: "Largest Rectangle in Histogram", difficulty: "Hard" },
    { topic: "Stack", title: "Basic Calculator", difficulty: "Hard" },
    { topic: "Stack", title: "Decode String", difficulty: "Medium" },
    { topic: "Stack", title: "Remove K Digits", difficulty: "Medium" },
    { topic: "Stack", title: "Asteroid Collision", difficulty: "Medium" },

    // Binary Search (10)
    { topic: "Binary Search", title: "Binary Search", difficulty: "Easy" },
    { topic: "Binary Search", title: "Search in Rotated Sorted Array", difficulty: "Medium" },
    { topic: "Binary Search", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium" },
    { topic: "Binary Search", title: "Koko Eating Bananas", difficulty: "Medium" },
    { topic: "Binary Search", title: "Capacity To Ship Packages Within D Days", difficulty: "Medium" },
    { topic: "Binary Search", title: "Time Based Key-Value Store", difficulty: "Medium" },
    { topic: "Binary Search", title: "Median of Two Sorted Arrays", difficulty: "Hard" },
    { topic: "Binary Search", title: "Search a 2D Matrix", difficulty: "Medium" },
    { topic: "Binary Search", title: "First Bad Version", difficulty: "Easy" },
    { topic: "Binary Search", title: "Peak Index in a Mountain Array", difficulty: "Easy" },

    // Linked List (10)
    { topic: "Linked List", title: "Reverse Linked List", difficulty: "Easy" },
    { topic: "Linked List", title: "Linked List Cycle", difficulty: "Easy" },
    { topic: "Linked List", title: "Merge Two Sorted Lists", difficulty: "Easy" },
    { topic: "Linked List", title: "Merge K Sorted Lists", difficulty: "Hard" },
    { topic: "Linked List", title: "Remove Nth Node From End of List", difficulty: "Medium" },
    { topic: "Linked List", title: "Reorder List", difficulty: "Medium" },
    { topic: "Linked List", title: "Add Two Numbers", difficulty: "Medium" },
    { topic: "Linked List", title: "Intersection of Two Linked Lists", difficulty: "Easy" },
    { topic: "Linked List", title: "Copy List with Random Pointer", difficulty: "Medium" },
    { topic: "Linked List", title: "Palindrome Linked List", difficulty: "Easy" },

    // Trees (20)
    { topic: "Trees", title: "Maximum Depth of Binary Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Same Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Invert Binary Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Binary Tree Level Order Traversal", difficulty: "Medium" },
    { topic: "Trees", title: "Validate Binary Search Tree", difficulty: "Medium" },
    { topic: "Trees", title: "Kth Smallest Element in a BST", difficulty: "Medium" },
    { topic: "Trees", title: "Lowest Common Ancestor of a BST", difficulty: "Medium" },
    { topic: "Trees", title: "Lowest Common Ancestor of Binary Tree", difficulty: "Medium" },
    { topic: "Trees", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium" },
    { topic: "Trees", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard" },
    { topic: "Trees", title: "Binary Tree Maximum Path Sum", difficulty: "Hard" },
    { topic: "Trees", title: "Diameter of Binary Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Balanced Binary Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Path Sum", difficulty: "Easy" },
    { topic: "Trees", title: "Subtree of Another Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Symmetric Tree", difficulty: "Easy" },
    { topic: "Trees", title: "Right Side View", difficulty: "Medium" },
    { topic: "Trees", title: "Count Good Nodes in Binary Tree", difficulty: "Medium" },
    { topic: "Trees", title: "Sum Root to Leaf Numbers", difficulty: "Medium" },
    { topic: "Trees", title: "Flatten Binary Tree to Linked List", difficulty: "Medium" },

    // Heap / Priority Queue (10)
    { topic: "Heap / Priority Queue", title: "Kth Largest Element in an Array", difficulty: "Medium" },
    { topic: "Heap / Priority Queue", title: "Top K Frequent Words", difficulty: "Medium" },
    { topic: "Heap / Priority Queue", title: "Find Median from Data Stream", difficulty: "Hard" },
    { topic: "Heap / Priority Queue", title: "Merge K Sorted Lists", difficulty: "Hard" },
    { topic: "Heap / Priority Queue", title: "Task Scheduler", difficulty: "Medium" },
    { topic: "Heap / Priority Queue", title: "Reorganize String", difficulty: "Medium" },
    { topic: "Heap / Priority Queue", title: "K Closest Points to Origin", difficulty: "Medium" },
    { topic: "Heap / Priority Queue", title: "Smallest Range Covering Elements from K Lists", difficulty: "Hard" },
    { topic: "Heap / Priority Queue", title: "Last Stone Weight", difficulty: "Easy" },
    { topic: "Heap / Priority Queue", title: "Furthest Building You Can Reach", difficulty: "Medium" },

    // Backtracking (10)
    { topic: "Backtracking", title: "Subsets", difficulty: "Medium" },
    { topic: "Backtracking", title: "Permutations", difficulty: "Medium" },
    { topic: "Backtracking", title: "Combination Sum", difficulty: "Medium" },
    { topic: "Backtracking", title: "Combination Sum II", difficulty: "Medium" },
    { topic: "Backtracking", title: "Word Search", difficulty: "Medium" },
    { topic: "Backtracking", title: "Palindrome Partitioning", difficulty: "Medium" },
    { topic: "Backtracking", title: "N-Queens", difficulty: "Hard" },
    { topic: "Backtracking", title: "Letter Combinations of a Phone Number", difficulty: "Medium" },
    { topic: "Backtracking", title: "Generate Parentheses", difficulty: "Medium" },
    { topic: "Backtracking", title: "Restore IP Addresses", difficulty: "Medium" },

    // Graph (15)
    { topic: "Graph", title: "Number of Islands", difficulty: "Medium" },
    { topic: "Graph", title: "Clone Graph", difficulty: "Medium" },
    { topic: "Graph", title: "Course Schedule", difficulty: "Medium" },
    { topic: "Graph", title: "Course Schedule II", difficulty: "Medium" },
    { topic: "Graph", title: "Pacific Atlantic Water Flow", difficulty: "Medium" },
    { topic: "Graph", title: "Graph Valid Tree", difficulty: "Medium" },
    { topic: "Graph", title: "Number of Connected Components", difficulty: "Medium" },
    { topic: "Graph", title: "Alien Dictionary", difficulty: "Hard" },
    { topic: "Graph", title: "Word Ladder", difficulty: "Hard" },
    { topic: "Graph", title: "Cheapest Flights Within K Stops", difficulty: "Medium" },
    { topic: "Graph", title: "Redundant Connection", difficulty: "Medium" },
    { topic: "Graph", title: "Network Delay Time", difficulty: "Medium" },
    { topic: "Graph", title: "Minimum Height Trees", difficulty: "Medium" },
    { topic: "Graph", title: "All Paths From Source to Target", difficulty: "Medium" },
    { topic: "Graph", title: "Accounts Merge", difficulty: "Medium" },

    // Dynamic Programming (15)
    { topic: "Dynamic Programming", title: "Climbing Stairs", difficulty: "Easy" },
    { topic: "Dynamic Programming", title: "House Robber", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "House Robber II", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Coin Change", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Longest Increasing Subsequence", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Longest Common Subsequence", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Word Break", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Combination Sum IV", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Decode Ways", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Unique Paths", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Partition Equal Subset Sum", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Target Sum", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Edit Distance", difficulty: "Hard" },
    { topic: "Dynamic Programming", title: "Maximum Product Subarray", difficulty: "Medium" },
    { topic: "Dynamic Programming", title: "Best Time to Buy and Sell Stock with Cooldown", difficulty: "Medium" },

    // Greedy (5)
    { topic: "Greedy", title: "Jump Game", difficulty: "Medium" },
    { topic: "Greedy", title: "Jump Game II", difficulty: "Medium" },
    { topic: "Greedy", title: "Gas Station", difficulty: "Medium" },
    { topic: "Greedy", title: "Merge Intervals", difficulty: "Medium" },
    { topic: "Greedy", title: "Non-overlapping Intervals", difficulty: "Medium" },

    // Advanced / Misc (5)
    { topic: "Advanced / Misc", title: "LRU Cache", difficulty: "Medium" },
    { topic: "Advanced / Misc", title: "Design Twitter", difficulty: "Medium" },
    { topic: "Advanced / Misc", title: "Random Pick with Weight", difficulty: "Medium" },
    { topic: "Advanced / Misc", title: "Implement Trie", difficulty: "Medium" },
    { topic: "Advanced / Misc", title: "Design Add and Search Words Data Structure", difficulty: "Medium" }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

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

            console.log(`\n[${i + 1}/150] Processing: ${problem.title} (${problem.difficulty})`);

            // Check if exists
            const existing = await CodingQuestion.findOne({ slug });
            if (existing) {
                console.log(`⏭️ Skipping: Problem already exists.`);
                skipCount++;
                continue;
            }

            let category = problem.topic;
            let title = problem.title;
            let difficulty = problem.difficulty;

            const prompt = `
                You are an expert Competitive Programming coach (FAANG Tier).
                Generate a professional coding challenge for: "${title}".
                Topic: ${category}
                Difficulty: ${difficulty}

                CRITICAL ACCURACY REQUIREMENT:
                - You MUST solve your own test cases. 
                - DO NOT HALLUCINATE ANSWERS. Accuracy is mandatory.
                - Double check 1-indexing vs 0-indexing.
                
                REQUIREMENTS:
                1. STARTER CODE: Multi-line class template for Javascript, Python, and C++.
                2. TEST DRIVER (CPP): A main function that reads inputs and prints outputs.
                3. TEST CASES: EXACTLY 10 test cases (3 visible, 7 hidden).
                4. NO Test case should be empty.
                
                JSON STRUCTURE:
                {
                    "problemStatement": (detailed markdown),
                    "constraints": [(strings)],
                    "examples": [
                        { "input": (string), "output": (string), "explanation": (string) }
                    ],
                    "starterCode": { "javascript": (string), "python": (string), "cpp": (string) },
                    "testDriver": { "javascript": (string), "python": (string), "cpp": (string) },
                    "visibleTestCases": [
                        { "input": (string), "expectedOutput": (string) }
                    ],
                    "hiddenTestCases": [
                        { "input": (string), "expectedOutput": (string) }
                    ]
                }
                
                IMPORTANT:
                - Return ONLY raw JSON. NO markdown blocks.
                - Ensure visibleTestCases has exactly 3 items.
                - Ensure hiddenTestCases has exactly 7 items.
                - Verification is mandatory.
            `;

            let retries = 2;
            let generatedData = null;

            while (retries >= 0) {
                try {
                    generatedData = await generateJsonGroq(prompt);
                    
                    // Validation
                    if (!generatedData.starterCode?.cpp || !generatedData.testDriver?.cpp) {
                        throw new Error('Missing C++ code/driver');
                    }
                    if (generatedData.visibleTestCases.length !== 3 || generatedData.hiddenTestCases.length !== 7) {
                        throw new Error(`Invalid test case count: ${generatedData.visibleTestCases.length}v + ${generatedData.hiddenTestCases.length}h`);
                    }
                    const allCases = [...generatedData.visibleTestCases, ...generatedData.hiddenTestCases];
                    if (allCases.some(tc => !tc.input || !tc.expectedOutput)) {
                        throw new Error('Empty test cases detected');
                    }
                    
                    break; // Success
                } catch (err) {
                    console.warn(`⚠️ Attempt failed for ${title}: ${err.message}. Retries left: ${retries}`);
                    retries--;
                    if (retries >= 0) await sleep(2000); // Small wait before retry
                }
            }

            if (generatedData) {
                try {
                    const acceptanceRate = Math.floor(Math.random() * (75 - 30 + 1)) + 30;
                    
                    await CodingQuestion.create({
                        ...generatedData,
                        title,
                        topic: category.toLowerCase(),
                        difficulty,
                        slug,
                        acceptanceRate,
                        submissionStats: { totalSubmissions: 0, acceptedSubmissions: 0 }
                    });
                    
                    console.log(`✅ Successfully seeded: ${title}`);
                    successCount++;
                } catch (saveErr) {
                    console.error(`❌ Failed to save ${title}:`, saveErr.message);
                    failCount++;
                }
            } else {
                console.error(`❌ Failed to generate ${title} after multiple attempts.`);
                failCount++;
            }

            // 5 second delay as requested
            if (i < questionsToSeed.length - 1) {
                console.log(`⏳ Waiting 5 seconds before next problem...`);
                await sleep(5000);
            }
        }

        console.log(`\n🚀 Seeding Completed!`);
        console.log(`Total: ${questionsToSeed.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Skipped: ${skipCount}`);
        console.log(`Failed: ${failCount}`);

        process.exit(0);
    } catch (err) {
        console.error('💥 Critical Seed Error:', err.message);
        process.exit(1);
    }
};

seedAIProblems();
