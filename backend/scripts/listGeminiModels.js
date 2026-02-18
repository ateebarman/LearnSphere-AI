import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;

const listModels = async () => {
    console.log(`Checking available models for key ending in ...${key.slice(-4)}`);
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        
        if (data.error) {
            console.error('Error:', data.error);
            return;
        }

        console.log('Available Models:');
        data.models?.forEach(m => {
            console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
};

listModels();
