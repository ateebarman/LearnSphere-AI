import fetch from 'node-fetch';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5001}/api`;
let TOKEN = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// Test configuration
const ENDPOINTS = [
  { name: 'Knowledge Nodes (All)', path: '/knowledge', method: 'GET' },
  { name: 'Knowledge Nodes (Category: DSA)', path: '/knowledge?category=DSA', method: 'GET' }, // Testing cache key variation
  { name: 'Coding Problems (Page 1)', path: '/coding/problems?page=1&limit=20', method: 'GET' },
  { name: 'User Analytics', path: '/analytics', method: 'GET' }, // Heavy aggregation + cache
  { name: 'User Roadmaps', path: '/roadmaps', method: 'GET' }, // .lean() optimization
];

async function login() {
  console.log('🔒 Login required to run benchmark.');
  const email = await askQuestion('Enter email: ');
  const password = await askQuestion('Enter password: ');

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);

    const data = await res.json();
    TOKEN = data.token;
    console.log('✅ Login successful!');
  } catch (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }
}

async function runBenchmark() {
  if (!TOKEN) await login();

  console.log('\n🚀 Starting Database & Cache Benchmark...\n');

  for (const endpoint of ENDPOINTS) {
    console.log(`Testing: ${endpoint.name} (${endpoint.path})`);
    
    // First run (Cache Miss / Cold)
    const t0 = performance.now();
    try {
        const res1 = await fetch(`${BASE_URL}${endpoint.path}`, {
            method: endpoint.method,
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const t1 = performance.now();
        const data1 = await res1.json();
        const size1 = JSON.stringify(data1).length;
        
        console.log(`  Attempt 1 (Cold/DB): ${(t1 - t0).toFixed(2)}ms | Size: ${(size1/1024).toFixed(2)}KB`);

        // Second run (Cache Hit / Warm)
        const t2 = performance.now();
        const res2 = await fetch(`${BASE_URL}${endpoint.path}`, {
            method: endpoint.method,
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const t3 = performance.now();
        
        console.log(`  Attempt 2 (Warm/Cache): ${(t3 - t2).toFixed(2)}ms`);
        
        const improvement = ((t1 - t0) - (t3 - t2));
        if (improvement > 0) {
            console.log(`  ⚡ Improvement: ${(improvement).toFixed(2)}ms faster`);
        } else {
            console.log(`  Running fast already (or no cache/small data)`);
        }

    } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
    }
    console.log('-----------------------------------');
  }

  console.log('\n✅ Benchmark Complete.');
  process.exit(0);
}

runBenchmark();
