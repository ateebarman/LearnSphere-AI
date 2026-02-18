import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/codingQuestionModel.js';

dotenv.config();

const checkProblems = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const problems = await CodingQuestion.find({}).select('title slug difficulty topic');
    console.log(`\nTotal Problems: ${problems.length}\n`);
    problems.forEach(p => console.log(`  - ${p.title} (${p.difficulty}) [${p.topic}]`));
    process.exit(0);
};

checkProblems();
