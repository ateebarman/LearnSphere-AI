import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const BACKEND_URL = `http://localhost:${process.env.PORT || 5001}`;
const API_ENDPOINT = `${BACKEND_URL}/api/tutor`;
const TEST_JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';

console.log('🧪 Tutor Chat Service Test');
console.log('===========================\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API Endpoint: ${API_ENDPOINT}\n`);

// Test cases
const testMessages = [
  'Explain React useEffect with example',
  'What is the difference between let and const in JavaScript?',
  'How do I handle errors in async/await?',
];

// Helper function to send message to tutor
async function sendToTutor(message, history = []) {
  try {
    console.log(`📤 Sending: "${message}"`);
    const response = await axios.post(
      API_ENDPOINT,
      {
        message,
        history,
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Response received:`);
    console.log(`${response.data.reply}\n`);
    console.log('-----------------------------------\n');

    return response.data.reply;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('-----------------------------------\n');
    throw error;
  }
}

// Run test
async function runTest() {
  try {
    let history = [];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      const reply = await sendToTutor(message, history);

      // Add to history for next message
      history.push({
        role: 'user',
        content: message,
      });
      history.push({
        role: 'assistant',
        content: reply,
      });

      // Small delay between requests
      if (i < testMessages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('✨ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();
