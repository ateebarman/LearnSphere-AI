import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

dotenv.config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Check if test user exists
        let testUser = await User.findOne({ email: 'test@test.com' });
        
        if (!testUser) {
            console.log('Creating test user...');
            testUser = await User.create({
                name: 'Test User',
                email: 'test@test.com',
                password: 'test123',
                preferences: {}
            });
            console.log('✅ Test user created');
        } else {
            console.log('✅ Test user already exists');
        }
        
        // Generate JWT token
        const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        
        console.log('\n📋 Test Credentials:');
        console.log(`   Email: test@test.com`);
        console.log(`   Password: test123`);
        console.log(`\n🔑 JWT Token:\n${token}\n`);
        console.log('Use this token in Authorization header:');
        console.log(`   Authorization: Bearer ${token}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

createTestUser();
