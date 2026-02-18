import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingQuestion from '../models/codingQuestionModel.js';
import UserCodingProgress from '../models/userCodingProgressModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        console.log('Clearing Coding Questions...');
        await CodingQuestion.deleteMany({});
        
        console.log('Clearing User Coding Progress...');
        await UserCodingProgress.deleteMany({});

        console.log('Data cleared successfully! 🚀');
        process.exit();
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
