// Test script to check available Gemini models
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];

if (!API_KEY) {
  console.error('❌ No API key found');
  process.exit(1);
}

async function listModels() {
  try {
    console.log('📋 Checking available Gemini models...\n');
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      { method: 'GET' }
    );

    const data = await res.json();

    if (data.models) {
      console.log('✅ Available models for generateContent:\n');
      const generateContentModels = data.models.filter(m => {
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('generateContent');
      });

      generateContentModels.forEach(model => {
        console.log(`  • ${model.name}`);
        console.log(`    - Version: ${model.version || 'N/A'}`);
        console.log(`    - Input tokens: ${model.inputTokenLimit || 'N/A'}`);
        console.log(`    - Output tokens: ${model.outputTokenLimit || 'N/A'}`);
        console.log('');
      });

      if (generateContentModels.length === 0) {
        console.log('  (No models found)');
      }

      console.log('\n📌 Testing top 3 models for text generation:\n');
      
      for (let i = 0; i < Math.min(3, generateContentModels.length); i++) {
        const modelName = generateContentModels[i].name.split('/')[1];
        console.log(`Testing ${modelName}...`);
        
        try {
          const testRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "working"' }] }]
              })
            }
          );

          if (testRes.ok) {
            console.log(`  ✅ ${modelName} - WORKING\n`);
          } else {
            const err = await testRes.json();
            console.log(`  ❌ ${modelName} - ${testRes.status}: ${err.error?.message || 'Unknown error'}\n`);
          }
        } catch (e) {
          console.log(`  ❌ ${modelName} - Connection error: ${e.message}\n`);
        }
      }
    } else {
      console.log('❌ No models returned:', data);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
    process.exit(1);
  }
}

listModels();
