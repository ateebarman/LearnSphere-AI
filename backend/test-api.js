import axios from 'axios';

const API_URL = 'http://localhost:5001/api';
let authToken = '';
let userId = '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function testEndpoints() {
  try {
    console.log('\n🧪 Starting API Tests...\n');

    // 1. Test Health Check
    console.log('1️⃣ Testing Health Check (GET /)');
    const healthCheck = await axios.get('http://localhost:5001/');
    console.log('✅ Health Check:', healthCheck.data);

    // 2. Test Signup
    console.log('\n2️⃣ Testing Signup (POST /api/auth/signup)');
    const signupRes = await api.post('/auth/signup', {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
    });
    console.log('✅ Signup Success:', signupRes.data);
    authToken = signupRes.data.token;
    userId = signupRes.data._id;

    // 3. Test Login
    console.log('\n3️⃣ Testing Login (POST /api/auth/login)');
    const loginRes = await api.post('/auth/login', {
      email: signupRes.data.email,
      password: 'password123',
    });
    console.log('✅ Login Success:', loginRes.data);

    // 4. Test Get Profile
    console.log('\n4️⃣ Testing Get Profile (GET /api/auth/profile)');
    const profileRes = await api.get('/auth/profile');
    console.log('✅ Profile:', profileRes.data);

    // 5. Test Generate Roadmap
    console.log('\n5️⃣ Testing Generate Roadmap (POST /api/roadmaps)');
    const roadmapRes = await api.post('/roadmaps', {
      topic: 'React Hooks',
    });
    console.log('✅ Roadmap Generated:', roadmapRes.data.title);

    // 6. Test Get Roadmaps
    console.log('\n6️⃣ Testing Get User Roadmaps (GET /api/roadmaps)');
    const roadmapsRes = await api.get('/roadmaps');
    console.log('✅ Total Roadmaps:', roadmapsRes.data.length);

    console.log('\n✅ All tests passed! Backend is working correctly!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testEndpoints();
