import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CodingQuestion from '../models/codingQuestionModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const syncProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const problemsToSync = ['longest-palindromic-substring', 'merge-intervals', 'clone-graph', 'two-sum'];

    for (const slug of problemsToSync) {
        const filePath = path.join(__dirname, `../data/problems/${slug}.json`);
        const problemData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const result = await CodingQuestion.findOneAndUpdate(
          { slug },
          { $set: problemData },
          { new: true }
        );

        if (result) {
          console.log(`🚀 Successfully updated ${slug} in the database!`);
        } else {
          console.log(`❌ Problem "${slug}" not found in database.`);
        }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('💥 Sync Failed:', err.message);
    process.exit(1);
  }
};

syncProblems();
