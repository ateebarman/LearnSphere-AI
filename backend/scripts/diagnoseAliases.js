import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY4;

const modelsToTest = [
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.5-flash'
];

async function diagnose() {
    console.log(`🔍 Diagnosing Alias Models for Key 4 (...${key?.slice(-4)})`);
    console.log('--------------------------------------------------');

    for (const model of modelsToTest) {
        process.stdout.write(`Testing ${model}... `);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "hi" }] }]
                })
            });

            const data = await res.json();

            if (res.ok) {
                console.log('✅ WORKING');
            } else {
                console.log(`❌ FAILED (${res.status})`);
                console.log(`   Message: ${data.error?.message || 'Unknown'}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
    console.log('--------------------------------------------------');
}

diagnose();
