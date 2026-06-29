const apiUrl = 'http://localhost:8080/api'; // Adjust port if needed

let authToken = '';

async function runTests() {
  console.log('🚀 Starting Endpoint Tests...\n');

  try {
    // 1. Auth: Signup
    console.log('Testing [POST] /api/auth/signup...');
    const registerRes = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        preferences: ['Java', 'Spring Boot']
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.ok && registerData.token) {
      console.log('✅ Registration Successful');
      authToken = registerData.token;
    } else if (registerRes.status === 400 && registerData.message.includes('already exists')) {
      console.log('⚠️ User already exists. Skipping to login.');
    } else {
      console.error('❌ Registration Failed:', registerData);
    }

    // 2. Auth: Get Current User (Protected Route)
    if (authToken) {
      console.log('\nTesting [GET] /api/auth/profile...');
      const meRes = await fetch(`${apiUrl}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (meRes.ok) {
        console.log('✅ Auth ME Successful');
      } else {
        console.error('❌ Auth ME Failed:', await meRes.json());
      }
    }

    // 3. Analytics: Dashboard (Protected)
    if (authToken) {
      console.log('\nTesting [GET] /api/analytics...');
      const analyticsRes = await fetch(`${apiUrl}/analytics`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (analyticsRes.ok) {
        console.log('✅ Analytics Dashboard Data Fetched Successfully');
      } else {
        console.error('❌ Analytics Failed:', await analyticsRes.json());
      }
    }

    // 4. Knowledge: Search
    console.log('\nTesting [GET] /api/knowledge?search=java...');
    const knowledgeRes = await fetch(`${apiUrl}/knowledge?search=java`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    if (knowledgeRes.ok) {
      console.log('✅ Knowledge Search Successful');
    } else {
      console.error('❌ Knowledge Search Failed:', await knowledgeRes.json());
    }

    // 5. Resources: Fetch YouTube + AI Articles
    console.log('\nTesting [GET] /api/resources/java...');
    const resourceRes = await fetch(`${apiUrl}/resources/java`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    if (resourceRes.ok) {
      const resources = await resourceRes.json();
      console.log(`✅ Resources Fetched Successfully (${resources.length} items found)`);
    } else {
      console.error('❌ Resources Fetch Failed:', await resourceRes.text());
    }

    // 6. Tutor: Chat
    if (authToken) {
      console.log('\nTesting [POST] /api/tutor...');
      const tutorRes = await fetch(`${apiUrl}/tutor`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            message: "What is Spring Boot?",
            history: []
        })
      });
      if (tutorRes.ok) {
        const reply = await tutorRes.json();
        console.log('✅ Tutor Chat Successful');
        console.log(`   Reply Preview: ${reply.reply.substring(0, 60)}...`);
      } else {
        console.error('❌ Tutor Chat Failed:', await tutorRes.json());
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (err) {
    console.error('\n💥 Test Script Failed. Is the Spring Boot server running?');
    console.error('Error Details:', err.message);
  }
}

runTests();
