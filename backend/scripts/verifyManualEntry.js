import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/CodingQuestion.js';

dotenv.config();

const verifyProblemInDB = async () => {
    console.log('🔍 Checking Database for Manual Entry...');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find the most recently created problem
        const problem = await CodingQuestion.findOne().sort({ createdAt: -1 });

        if (!problem) {
            console.log('❌ No problems found in database.');
            return;
        }

        console.log('\n✅ FOUND PROBLEM');
        console.log('----------------------------');
        console.log('Title:     ', problem.title);
        console.log('Topic:     ', problem.topic);
        console.log('Created At:', problem.createdAt);
        console.log('----------------------------');

        const checks = {
            hasStatement: !!problem.problemStatement,
            hasTests: problem.visibleTestCases.length > 0,
            hasRefSolution: !!problem.referenceSolution.javascript,
            hasJudge: !!problem.judgeDriver.javascript
        };

        console.log('\nIntegrity Check:');
        Object.entries(checks).forEach(([key, val]) => {
            console.log(`- ${key}: ${val ? '✅' : '❌'}`);
        });

        if (Object.values(checks).every(v => v)) {
            console.log('\n🎉 SUCCESS: The manual creation form is saving correctly!');
        }

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

verifyProblemInDB();
