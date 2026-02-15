import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/codingQuestionModel.js';
import { generateJson, initializeAI } from '../services/ai/index.js';
import { generateJsonGroq } from '../services/ai/providers/groq.client.js';

dotenv.config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const refineLibrary = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Ensure AI is initialized (Gemini provider will now rotate models as requested)
        process.env.AI_PROVIDER = 'gemini';
        initializeAI(); 

        const questions = await CodingQuestion.find().sort({ createdAt: 1 });
        console.log(`Found ${questions.length} problems. Checking which need refinement...`);

        let refinedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            // Heuristic for "Already Refined": Detailed description and Multi-line code
            const isAlreadyRefined = 
                question.problemStatement.length > 800 && 
                question.starterCode?.cpp?.split('\n').length > 5;

            if (isAlreadyRefined) {
                skippedCount++;
                continue;
            }

            console.log(`\n[${i + 1}/${questions.length}] Refining: ${question.title}...`);

            const prompt = `
                You are an elite Competitive Programming instructor.
                UPGRADE the following coding problem to meet LEETCODE PRODUCTION STANDARDS.
                
                Title: ${question.title}
                Topic: ${question.topic}
                Difficulty: ${question.difficulty}

                CRITICAL UPGRADE REQUIREMENTS:
                1. PROBLEM STATEMENT (EXCEPTIONAL DETAIL):
                   - Provide a deep, professional, and clear markdown description (3-4 paragraphs).
                   - Use tables for complexities and LaTeX math ($O(N)$).
                
                2. STARTER CODE (STRICT CLASS STRUCTURE):
                   - YOU MUST use multiple lines and 4-space indentation.
                   - Python: "class Solution:"
                   - C++: "class Solution { public: ..."
                   - JavaScript: "class Solution { ..."
                
                3. ACCURACY:
                   - Ensure 3 visible and 7 hidden test cases are 100% correct.

                JSON OUTPUT STRUCTURE:
                {
                    "problemStatement": (string),
                    "constraints": [string],
                    "examples": [{ "input": string, "output": string, "explanation": string }],
                    "starterCode": { "javascript": string, "python": string, "cpp": string },
                    "testDriver": { "javascript": string, "python": string, "cpp": string },
                    "visibleTestCases": [{ "input": string, "expectedOutput": string }],
                    "hiddenTestCases": [{ "input": string, "expectedOutput": string }]
                }
            `;

            let success = false;
            let providerAttempts = 0;
            // Strategy: Gemini (High Quality/High Quota) -> Groq 70B (High Quality) -> Groq 8B (Safety)
            const strategies = [
                { type: 'gemini', model: 'Gemini-Rotation' },
                { type: 'groq', model: 'llama-3.3-70b-versatile' },
                { type: 'groq', model: 'llama-3.1-8b-instant' }
            ];

            while (!success && providerAttempts < strategies.length) {
                const strategy = strategies[providerAttempts];
                try {
                    console.log(`📡 Attempting with ${strategy.model}...`);
                    let refinedData;
                    
                    if (strategy.type === 'gemini') {
                        process.env.AI_PROVIDER = 'gemini';
                        refinedData = await generateJson(prompt);
                    } else {
                        refinedData = await generateJsonGroq(prompt, strategy.model);
                    }

                    // Validation
                    const cppCode = refinedData.starterCode?.cpp || '';
                    if (cppCode.includes('; }') || (cppCode.split('\n').length < 5 && !question.title.includes('Sum'))) {
                         throw new Error('Code formatting too compact');
                    }

                    await CodingQuestion.findByIdAndUpdate(question._id, {
                        ...refinedData,
                        topic: question.topic,
                        title: question.title,
                        difficulty: question.difficulty
                    });
                    
                    console.log(`✅ Fully Refined: ${question.title}`);
                    success = true;
                    refinedCount++;
                } catch (err) {
                    const isQuotaError = err.message.includes('429') || err.message.includes('QUOTA') || err.message.includes('limit');
                    console.warn(`⚠️  ${strategy.model} failed: ${isQuotaError ? 'RATE LIMITED' : err.message}`);
                    providerAttempts++;
                    if (!success && providerAttempts < strategies.length) {
                        await sleep(2000);
                    }
                }
            }

            if (!success) {
                console.error(`❌ Failed all providers for ${question.title}.`);
                await sleep(10000); 
            } else {
                // Safety delay between successful refinements
                await sleep(5000);
            }
        }

        console.log(`\n✨ Refinement Session Complete!`);
        console.log(`Refined: ${refinedCount}, Skipped: ${skippedCount}`);
        process.exit(0);
    } catch (err) {
        console.error('💥 Script Crash:', err.message);
        process.exit(1);
    }
};

refineLibrary();
