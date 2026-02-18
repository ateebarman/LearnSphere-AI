import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CodingQuestion from '../models/codingQuestionModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedFromTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const problemsDir = path.join(__dirname, '../data/problems');
        const files = fs.readdirSync(problemsDir).filter(f => f.endsWith('.json'));

        console.log(`Found ${files.length} problem templates\n`);

        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        for (const file of files) {
            const filePath = path.join(problemsDir, file);
            const problemData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            console.log(`📝 Processing: ${problemData.title}`);

            try {
                await CodingQuestion.findOneAndUpdate(
                    { slug: problemData.slug },
                    problemData,
                    { upsert: true, new: true }
                );
                console.log('  ✅ Successfully seeded (upserted)\n');
                successCount++;
            } catch (err) {
                console.error(`  ❌ Failed: ${err.message}\n`);
                failCount++;
            }
        }

        console.log('\n🏁 Seeding Complete!');
        console.log(`   Success: ${successCount}`);
        console.log(`   Skipped: ${skipCount}`);
        console.log(`   Failed: ${failCount}`);

        process.exit(0);
    } catch (err) {
        console.error('💥 Fatal Error:', err.message);
        process.exit(1);
    }
};

seedFromTemplates();
