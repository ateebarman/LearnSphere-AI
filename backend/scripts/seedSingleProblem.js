import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CodingQuestion from '../models/codingQuestionModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to env based on typical project structure
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSingleProblem = async () => {
    const filename = process.argv[2];

    if (!filename) {
        console.log('\x1b[31m%s\x1b[0m', '❌ Please provide a filename from backend/data/problems/');
        console.log('Example: node scripts/seedSingleProblem.js two-sum.json');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const filePath = path.join(__dirname, '../data/problems', filename);
        
        if (!fs.existsSync(filePath)) {
            console.error('\x1b[31m%s\x1b[0m', `❌ File not found at: ${filePath}`);
            
            // Helpful: check if it's a slug without .json
            if (!filename.endsWith('.json')) {
                const altPath = filePath + '.json';
                if (fs.existsSync(altPath)) {
                    console.log(`💡 Did you mean "${filename}.json"?`);
                }
            }
            process.exit(1);
        }

        const problemData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (!problemData.slug) {
            console.error('❌ Problem data is missing a slug.');
            process.exit(1);
        }

        const slug = problemData.slug;
        console.log(`📝 Processing: \x1b[36m${problemData.title}\x1b[0m (slug: ${slug})`);

        // Use findOneAndUpdate with $set to keep existing _id and only update/insert fields
        const result = await CodingQuestion.findOneAndUpdate(
            { slug: slug },
            { $set: problemData },
            { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        if (result) {
            console.log('\x1b[32m%s\x1b[0m', `✅ Successfully seeded/updated problem in database.`);
            console.log(`ID: ${result._id}`);
        }

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', '💥 Error:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
};

seedSingleProblem();
