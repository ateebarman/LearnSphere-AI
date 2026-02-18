import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import dotenv from 'dotenv';
import Roadmap from '../models/roadmapModel.js';
import QuizAttempt from '../models/quizAttemptModel.js';
import Submission from '../models/submissionModel.js';

dotenv.config();

const verifySetup = async () => {
  console.log('🔍 Verifying Database Setup...');

  try {
    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // 2. Check Indexes
    const roadmapIndexes = await Roadmap.listIndexes();
    const quizIndexes = await QuizAttempt.listIndexes();
    const submissionIndexes = await Submission.listIndexes();

    console.log('\n📊 Index Verification:');
    
    const checkIndex = (indexes, name, fields) => {
      const found = indexes.some(idx => {
        const keys = Object.keys(idx.key).join(',');
        return keys === fields;
      });
      console.log(`  - ${name} (${fields}): ${found ? '✅ Found' : '❌ Missing'}`);
    };

    checkIndex(roadmapIndexes, 'Roadmap User', 'user,createdAt');
    checkIndex(quizIndexes, 'Quiz User/Roadmap', 'user,roadmap');
    checkIndex(submissionIndexes, 'Submission User/Question', 'user,question,status');
    
    // 3. Check Redis
    console.log('\n🔌 Redis Verification:');
    if (redisClient) {
        // Wait briefly for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (redisClient.status === 'ready' || redisClient.status === 'connect') {
            console.log('  ✅ Redis Client Initialized');
            try {
                await redisClient.set('verify_test', 'working', 'EX', 10);
                const val = await redisClient.get('verify_test');
                console.log(`  ✅ Cache Read/Write Test: ${val === 'working' ? 'Success' : 'Failed'}`);
            } catch (e) {
                console.log(`  ❌ Cache Test Failed: ${e.message}`);
            }
        } else {
             console.log(`  ⚠️ Redis Client Status: ${redisClient.status}`);
        }
    } else {
        console.log('  ⚠️ Redis Client Not Initialized (Check REDIS_URL)');
    }

  } catch (error) {
    console.error('❌ Verification Failed:', error.message);
  } finally {
    try {
        await mongoose.disconnect();
        if (redisClient) redisClient.disconnect();
    } catch (e) {}
    process.exit(0);
  }
};

verifySetup();
