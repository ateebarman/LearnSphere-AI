import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import KnowledgeNode from '../models/knowledgeModel.js';
import { generateJson } from '../services/ai/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });


const TOPICS = [

  // =========================
  // 1. DATA STRUCTURES & ALGORITHMS
  // =========================
  

// 1. COMPREHENSIVE TOPICS LIST
 // 1. DATA STRUCTURES & ALGORITHMS
  // =========================
  { topic: 'Arrays & Dynamic Resizing', category: 'DSA' },
  { topic: 'Singly & Doubly Linked Lists', category: 'DSA' },
  { topic: 'Stacks (LIFO) & Queues (FIFO)', category: 'DSA' },
  { topic: 'Binary Search Trees (BST)', category: 'DSA' },
  { topic: 'AVL & Red-Black Trees', category: 'DSA' },
  { topic: 'B-Trees & B+ Trees', category: 'DSA' },
  { topic: 'Tries (Prefix Trees)', category: 'DSA' },
  { topic: 'Hash Tables & Collision Resolution', category: 'DSA' },
  { topic: 'Priority Queues & Binary Heaps', category: 'DSA' },
  { topic: 'Graphs (Adjacency Matrix vs List)', category: 'DSA' },
  { topic: 'Dijkstra’s & Bellman-Ford Algorithms', category: 'DSA' },
  { topic: 'Prim’s & Kruskal’s MST', category: 'DSA' },
  { topic: 'Dynamic Programming: Memoization vs Tabulation', category: 'DSA' },
  { topic: 'Bit Manipulation & Bitmasking', category: 'DSA' },
  { topic: 'Topological Sorting', category: 'DSA' },

  // Advanced DSA
  { topic: 'Two Pointer Technique', category: 'DSA' },
  { topic: 'Sliding Window Algorithms', category: 'DSA' },
  { topic: 'Monotonic Stack & Queue', category: 'DSA' },
  { topic: 'Union Find (Disjoint Set Union)', category: 'DSA' },
  { topic: 'Segment Trees', category: 'DSA' },
  { topic: 'Fenwick Tree (Binary Indexed Tree)', category: 'DSA' },
  { topic: 'Sparse Tables', category: 'DSA' },
  { topic: 'Heavy Light Decomposition', category: 'DSA' },
  { topic: 'Lowest Common Ancestor (LCA)', category: 'DSA' },
  { topic: 'Euler Tour Technique', category: 'DSA' },
  { topic: 'Mo’s Algorithm', category: 'DSA' },
  { topic: 'String Hashing (Rolling Hash)', category: 'DSA' },
  { topic: 'KMP String Matching Algorithm', category: 'DSA' },
  { topic: 'Z Algorithm', category: 'DSA' },
  { topic: 'Rabin-Karp Algorithm', category: 'DSA' },
  { topic: 'Suffix Arrays & LCP Array', category: 'DSA' },
  { topic: 'Manacher’s Algorithm', category: 'DSA' },
  { topic: 'Backtracking & Constraint Solving', category: 'DSA' },
  { topic: 'Meet in the Middle Technique', category: 'DSA' },
  { topic: 'Game Theory Basics (Nim Game)', category: 'DSA' },

  // =========================
  // 2. OPERATING SYSTEMS
  // =========================
  { topic: 'Process vs Thread & Context Switching', category: 'OS' },
  { topic: 'CPU Scheduling Algorithms', category: 'OS' },
  { topic: 'Deadlock Detection & Banker’s Algorithm', category: 'OS' },
  { topic: 'Paging & Virtual Memory Management', category: 'OS' },
  { topic: 'File System Internals (Inode/NTFS)', category: 'OS' },
  { topic: 'Inter-Process Communication (IPC)', category: 'OS' },
  { topic: 'Kernel vs User Mode', category: 'OS' },

  { topic: 'Process Synchronization (Semaphores & Mutex)', category: 'OS' },
  { topic: 'Readers-Writers Problem', category: 'OS' },
  { topic: 'Dining Philosophers Problem', category: 'OS' },
  { topic: 'Memory Fragmentation (Internal vs External)', category: 'OS' },
  { topic: 'TLB (Translation Lookaside Buffer)', category: 'OS' },
  { topic: 'Copy-on-Write Mechanism', category: 'OS' },
  { topic: 'System Calls & Interrupt Handling', category: 'OS' },
  { topic: 'Linux Scheduling (CFS)', category: 'OS' },
  { topic: 'NUMA Architecture', category: 'OS' },
  { topic: 'I/O Scheduling Algorithms', category: 'OS' },

  // =========================
  // 3. COMPUTER NETWORKING
  // =========================
  { topic: 'OSI Model & TCP/IP Stack', category: 'Networking' },
  { topic: 'DNS & How the Internet Works', category: 'Networking' },
  { topic: 'HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)', category: 'Networking' },
  { topic: 'TCP 3-Way Handshake & Flow Control', category: 'Networking' },
  { topic: 'WebSocket & Real-time Communication', category: 'Networking' },
  { topic: 'Load Balancing (L4 vs L7)', category: 'Networking' },

  { topic: 'UDP vs TCP Deep Comparison', category: 'Networking' },
  { topic: 'Congestion Control Algorithms', category: 'Networking' },
  { topic: 'TLS/SSL Handshake', category: 'Networking' },
  { topic: 'CDN Architecture', category: 'Networking' },
  { topic: 'Reverse Proxy vs Forward Proxy', category: 'Networking' },
  { topic: 'NAT & PAT', category: 'Networking' },
  { topic: 'ARP Protocol', category: 'Networking' },
  { topic: 'ICMP & Ping Mechanism', category: 'Networking' },
  { topic: 'Anycast vs Unicast vs Multicast', category: 'Networking' },
  { topic: 'Network Packet Fragmentation', category: 'Networking' },

  // =========================
  // 4. DATABASE SYSTEMS
  // =========================
  { topic: 'Database Normalization (1NF to BCNF)', category: 'Database' },
  { topic: 'ACID Properties & Transaction Isolation', category: 'Database' },
  { topic: 'LSM Trees vs B-Trees for Storage', category: 'Database' },
  { topic: 'Multi-Version Concurrency Control (MVCC)', category: 'Database' },
  { topic: 'SQL vs NoSQL: CAP Theorem', category: 'Database' },
  { topic: 'Indexing Strategies (Clustered vs Non-Clustered)', category: 'Database' },

  { topic: 'Query Optimization & Execution Plans', category: 'Database' },
  { topic: 'Write-Ahead Logging (WAL)', category: 'Database' },
  { topic: 'Database Sharding Strategies', category: 'Database' },
  { topic: 'Replication (Master-Slave & Multi-Master)', category: 'Database' },
  { topic: 'Distributed Transactions (2PC)', category: 'Database' },
  { topic: 'Database Caching Strategies', category: 'Database' },
  { topic: 'Materialized Views', category: 'Database' },
  { topic: 'OLTP vs OLAP Systems', category: 'Database' },
  { topic: 'Columnar vs Row Storage', category: 'Database' },
  { topic: 'Bloom Filters in Databases', category: 'Database' },

  // =========================
  // 5. SYSTEM DESIGN & DISTRIBUTED SYSTEMS
  // =========================
  { topic: 'Microservices vs Monolith Architecture', category: 'System Design' },
  { topic: 'Message Queues (Kafka vs RabbitMQ)', category: 'System Design' },
  { topic: 'Consistent Hashing', category: 'System Design' },
  { topic: 'Rate Limiting Algorithms (Leaky/Token Bucket)', category: 'System Design' },
  { topic: 'Service Mesh & Sidecar Patterns', category: 'System Design' },
  { topic: 'Byzantine Fault Tolerance', category: 'Distributed Systems' },
  { topic: 'Vector Clocks & Logical Time', category: 'Distributed Systems' },

  { topic: 'CAP Theorem Deep Dive', category: 'System Design' },
  { topic: 'Event Driven Architecture', category: 'System Design' },
  { topic: 'API Gateway Pattern', category: 'System Design' },
  { topic: 'Circuit Breaker Pattern', category: 'System Design' },
  { topic: 'Saga Pattern', category: 'System Design' },
  { topic: 'Distributed Caching (Redis)', category: 'System Design' },
  { topic: 'Database Partitioning', category: 'System Design' },
  { topic: 'Horizontal vs Vertical Scaling', category: 'System Design' },
  { topic: 'Leader Election Algorithms', category: 'Distributed Systems' },
  { topic: 'Consensus Algorithms (Raft & Paxos)', category: 'Distributed Systems' },

  // =========================
  // 6. AI / ML
  // =========================
  { topic: 'Transformers & Self-Attention Mechanism', category: 'AI/ML' },
  { topic: 'RAG (Retrieval Augmented Generation)', category: 'AI/ML' },
  { topic: 'Fine-tuning LLMs vs Prompt Engineering', category: 'AI/ML' },
  { topic: 'Vector Embeddings & Vector Databases', category: 'AI/ML' },
  { topic: 'Convolutional Neural Networks (CNN)', category: 'AI/ML' },
  { topic: 'Reinforcement Learning from Human Feedback (RLHF)', category: 'AI/ML' },
  { topic: 'Diffusion Models for Image Generation', category: 'AI/ML' },

  { topic: 'Attention vs Self-Attention', category: 'AI/ML' },
  { topic: 'Tokenization Techniques (BPE/WordPiece)', category: 'AI/ML' },
  { topic: 'Embedding Similarity (Cosine vs Dot)', category: 'AI/ML' },
  { topic: 'ANN Search (HNSW, FAISS)', category: 'AI/ML' },
  { topic: 'Prompt Injection Attacks', category: 'AI/ML' },
  { topic: 'Model Quantization', category: 'AI/ML' },
  { topic: 'LoRA Fine-Tuning', category: 'AI/ML' },
  { topic: 'Hallucination in LLMs', category: 'AI/ML' },
  { topic: 'Evaluation Metrics (BLEU, ROUGE)', category: 'AI/ML' },
  { topic: 'Multi-modal Models', category: 'AI/ML' },

  // =========================
  // 7. COMPILER DESIGN & LANGUAGES
  // =========================
  { topic: 'Lexical Analysis & Parsing', category: 'Compiler Design' },
  { topic: 'Abstract Syntax Trees (AST)', category: 'Compiler Design' },
  { topic: 'JIT (Just-In-Time) Compilation', category: 'Compiler Design' },
  { topic: 'Garbage Collection Algorithms', category: 'Languages' },
  { topic: 'Rust Ownership & Borrowing Model', category: 'Languages' },

  // =========================
  // 8. SECURITY
  // =========================
  { topic: 'Asymmetric vs Symmetric Encryption', category: 'Security' },
  { topic: 'JWT, OAuth2 & OpenID Connect', category: 'Security' },
  { topic: 'Zero Trust Security Architecture', category: 'Security' },
  { topic: 'SQL Injection, XSS, and CSRF Defense', category: 'Security' },
  { topic: 'Blockchain & Smart Contract Security', category: 'Security' },

  { topic: 'HTTPS End-to-End Flow', category: 'Security' },
  { topic: 'Password Hashing (bcrypt/argon2)', category: 'Security' },
  { topic: 'Public Key Infrastructure (PKI)', category: 'Security' },
  { topic: 'Replay Attacks', category: 'Security' },
  { topic: 'Man-in-the-Middle Attack', category: 'Security' },
  { topic: 'API Security Best Practices', category: 'Security' },
  { topic: 'Secrets Management', category: 'Security' },
  { topic: 'OWASP Top 10', category: 'Security' },
  { topic: 'Secure Cookies & SameSite', category: 'Security' },
  { topic: 'CORS Policy', category: 'Security' },

  // =========================
  // 9. BIG DATA & CLOUD / DEVOPS
  // =========================
  { topic: 'MapReduce & Apache Spark', category: 'Big Data' },
  { topic: 'Cloud Computing (SaaS, PaaS, IaaS)', category: 'Cloud' },
  { topic: 'Docker & Kubernetes Orchestration', category: 'DevOps' },
  { topic: 'Infrastructure as Code (Terraform)', category: 'DevOps' },
  { topic: 'CI/CD Pipeline Automation', category: 'DevOps' },

  { topic: 'Autoscaling Strategies', category: 'Cloud' },
  { topic: 'Serverless Architecture', category: 'Cloud' },
  { topic: 'Load Testing vs Stress Testing', category: 'DevOps' },
  { topic: 'Blue-Green Deployment', category: 'DevOps' },
  { topic: 'Canary Deployment', category: 'DevOps' },
  { topic: 'Observability (Logs, Metrics, Traces)', category: 'DevOps' },
  { topic: 'Distributed Tracing', category: 'DevOps' },
  { topic: 'Service Discovery', category: 'DevOps' },
  { topic: 'Container Networking', category: 'DevOps' },
  { topic: 'Helm Charts', category: 'DevOps' },

  // =========================
  // 10. EMERGING TECH & LOW LEVEL
  // =========================
  { topic: 'Quantum Computing Fundamentals', category: 'Emerging Tech' },
  { topic: 'Edge & Fog Computing', category: 'Cloud' },
  { topic: 'RTOS & Embedded Systems Programming', category: 'Embedded' },
  { topic: 'Web3 & Decentralized Applications', category: 'Emerging Tech' },

  { topic: 'CPU Cache & Cache Locality', category: 'Low Level' },
  { topic: 'Memory Alignment', category: 'Low Level' },
  { topic: 'False Sharing', category: 'Low Level' },
  { topic: 'Lock-Free Programming', category: 'Low Level' },
  { topic: 'SIMD Basics', category: 'Low Level' },
  { topic: 'Profiling & Performance Optimization', category: 'Low Level' },
  { topic: 'Latency vs Throughput', category: 'Low Level' },
  { topic: 'Zero Copy Networking', category: 'Low Level' },
  { topic: 'Memory Pooling', category: 'Low Level' },
  { topic: 'Event Loop Architecture (Node.js)', category: 'Low Level' }
];

// 2. GROQ-ONLY ROTATOR (Bypassing throttled Gemini for now)
const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY3,
  process.env.GROQ_API_KEY4
].filter(Boolean);

let keyIndex = 0;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding');
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const seedTopic = async (topicObj) => {
  console.log(`\n🚀 Generating Documentation for: ${topicObj.topic}...`);

  // Check if already exists
  const exists = await KnowledgeNode.findOne({ topic: topicObj.topic });
  if (exists) {
    console.log(`⏭️  ${topicObj.topic} already exists. Skipping.`);
    return;
  }

  // Force AI provider to groq for this run
  process.env.AI_PROVIDER = 'groq';
  
  const prompt = `
    Produce professional technical documentation for the topic: "${topicObj.topic}".
    Category: ${topicObj.category}.
    
    JSON STRUCTURE:
    {
      "summary": "1-2 paragraphs high-level overview.",
      "detailedContent": "In-depth technical explanation (4-5 paragraphs).",
      "keyPrinciples": ["Core Rule 1", "Core Rule 2", "Core Rule 3"],
      "commonPitfalls": ["What to avoid 1", "What to avoid 2", "What to avoid 3"],
      "complexity": { "time": "O(?)", "space": "O(?)" },
      "codeSnippets": [
        { "language": "javascript", "code": "...", "explanation": "..." },
        { "language": "python", "code": "...", "explanation": "..." }
      ],
      "verifiedResources": [
        { "title": "Official Documentation", "url": "https://...", "type": "doc" },
        { "title": "In-depth Guide", "url": "https://...", "type": "article" }
      ]
    }
  `;

  try {
    let data;
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      try {
        data = await generateJson(prompt);
        success = true;
      } catch (err) {
        attempts++;
        if (err.message.includes('429')) {
          console.warn(`⚠️ Rate limit hit for ${topicObj.topic}. Attempt ${attempts}/${maxAttempts}...`);
          // Extract wait time if possible, else default to 60s
          const waitTimeMatch = err.message.match(/in (\d+m\d+\.\d+s|\d+\.\d+s|\d+s)/);
          let waitMs = 60000;
          if (waitTimeMatch) {
            const timeStr = waitTimeMatch[1];
            if (timeStr.includes('m')) {
              const [m, s] = timeStr.split('m');
              waitMs = (parseInt(m) * 60 + parseFloat(s)) * 1000 + 2000;
            } else {
              waitMs = parseFloat(timeStr) * 1000 + 2000;
            }
          }
          console.log(`⏳ Waiting ${Math.round(waitMs / 1000)}s before retry...`);
          await wait(waitMs);
        } else {
          throw err;
        }
      }
    }

    if (!success) throw new Error('Max retries exceeded');
    
    // Sanitize resource types for Mongoose Enum
    if (data.verifiedResources && Array.isArray(data.verifiedResources)) {
      data.verifiedResources = data.verifiedResources.map(r => {
        const allowed = ['doc', 'video', 'article'];
        let type = (r.type || 'doc').toLowerCase();
        if (!allowed.includes(type)) {
          if (type.includes('video') || type.includes('youtube')) type = 'video';
          else if (type.includes('doc') || type.includes('guide')) type = 'doc';
          else type = 'article';
        }
        return { ...r, type };
      });
    }

    const newNode = new KnowledgeNode({
      topic: topicObj.topic,
      category: topicObj.category,
      ...data
    });

    await newNode.save();
    console.log(`✅ Successfully seeded: ${topicObj.topic} (Key ${keyIndex % GROQ_KEYS.length + 1})`);
  } catch (err) {
    console.error(`❌ Failed to seed ${topicObj.topic}:`, err.message);
  }
};

const runSeeder = async () => {
  await connectDB();
  
  console.log(`📊 Starting Seeder for ${TOPICS.length} topics...`);
  
  for (const topic of TOPICS) {
    await seedTopic(topic);
    // 5 second delay to respect Groq's RPM
    console.log('⏱️  Waiting 5 seconds for rate-limit safety...');
    await wait(5000);
  }

  console.log('\n✨ Seeding Complete! Your local Knowledge Base is ready.');
  process.exit(0);
};

runSeeder();
