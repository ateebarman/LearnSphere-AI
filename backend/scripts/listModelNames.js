import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY;
const listModels = async () => {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log('No models found:', data);
        }
    } catch (e) { console.error(e); }
};
listModels();
