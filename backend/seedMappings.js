import mongoose from 'mongoose';
import CategoryMapping from './models/categoryMappingModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * PRODUCTION-READY CATEGORY MAPPING SEEDER
 * Uses bulkWrite with upsert to prevent data loss and ensure re-runnability.
 */
const seedCategoryMappings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB. Starting production-safe sync...');

    const mappings = [
      // ==========================
      // DSA – Core & Basic
      // ==========================
      { tag: 'binary tree', categories: ['DSA'] },
      { tag: 'algorithms', categories: ['DSA'] },
      { tag: 'algorithm', categories: ['DSA'] },
      { tag: 'data structures', categories: ['DSA'] },
      { tag: 'data structure', categories: ['DSA'] },
      { tag: 'dsa', categories: ['DSA'] },
      { tag: 'algo', categories: ['DSA'] },
      { tag: 'sorting', categories: ['DSA'] },
      { tag: 'searching', categories: ['DSA'] },
      { tag: 'leetcode', categories: ['DSA'] },
      { tag: 'recursion', categories: ['DSA'] },
      { tag: 'dynamic programming', categories: ['DSA'] },
      { tag: 'graph', categories: ['DSA'] },
      { tag: 'linked list', categories: ['DSA'] },
      { tag: 'stack', categories: ['DSA'] },
      { tag: 'queue', categories: ['DSA'] },
      { tag: 'hash table', categories: ['DSA'] },
      { tag: 'heap', categories: ['DSA'] },
      { tag: 'trie', categories: ['DSA'] },
      { tag: 'big o', categories: ['DSA'] },

      // ==========================
      // DSA – Advanced & Interview
      // ==========================
      { tag: 'binary search', categories: ['DSA'] },
      { tag: 'merge sort', categories: ['DSA'] },
      { tag: 'quick sort', categories: ['DSA'] },
      { tag: 'heap sort', categories: ['DSA'] },
      { tag: 'bfs', categories: ['DSA'] },
      { tag: 'dfs', categories: ['DSA'] },
      { tag: 'topological sort', categories: ['DSA'] },
      { tag: 'union find', categories: ['DSA'] },
      { tag: 'disjoint set', categories: ['DSA'] },
      { tag: 'segment tree', categories: ['DSA'] },
      { tag: 'fenwick tree', categories: ['DSA'] },
      { tag: 'bitmasking', categories: ['DSA'] },
      { tag: 'greedy algorithm', categories: ['DSA'] },
      { tag: 'backtracking', categories: ['DSA'] },
      { tag: 'sliding window', categories: ['DSA'] },
      { tag: 'two pointers', categories: ['DSA'] },
      { tag: 'kmp', categories: ['DSA'] },
      { tag: 'rabin karp', categories: ['DSA'] },
      { tag: 'suffix array', categories: ['DSA'] },
      { tag: 'manacher', categories: ['DSA'] },

      // ==========================
      // Database – Core
      // ==========================
      { tag: 'sql', categories: ['Database'] },
      { tag: 'nosql', categories: ['Database'] },
      { tag: 'mongodb', categories: ['Database'] },
      { tag: 'postgresql', categories: ['Database'] },
      { tag: 'normalization', categories: ['Database'] },
      { tag: 'indexing', categories: ['Database'] },
      { tag: 'database', categories: ['Database'] },
      { tag: 'dbms', categories: ['Database'] },
      { tag: 'acid', categories: ['Database'] },
      { tag: 'transactions', categories: ['Database'] },

      // ==========================
      // Database – Advanced
      // ==========================
      { tag: 'joins', categories: ['Database'] },
      { tag: 'group by', categories: ['Database'] },
      { tag: 'having clause', categories: ['Database'] },
      { tag: 'query optimization', categories: ['Database'] },
      { tag: 'execution plan', categories: ['Database'] },
      { tag: 'wal', categories: ['Database'] },
      { tag: 'mvcc', categories: ['Database'] },
      { tag: '2pc', categories: ['Database', 'Distributed Systems'] },
      { tag: 'cap theorem', categories: ['Database', 'System Design'] },
      { tag: 'columnar storage', categories: ['Database'] },
      { tag: 'row storage', categories: ['Database'] },
      { tag: 'b tree', categories: ['Database', 'DSA'] },
      { tag: 'lsm tree', categories: ['Database'] },
      { tag: 'database replication', categories: ['Database', 'System Design'] },

      // ==========================
      // Operating Systems – Core
      // ==========================
      { tag: 'process', categories: ['OS'] },
      { tag: 'scheduling', categories: ['OS'] },
      { tag: 'kernel', categories: ['OS'] },
      { tag: 'memory management', categories: ['OS'] },
      { tag: 'concurrency', categories: ['OS', 'System Design'] },
      { tag: 'thread', categories: ['OS'] },
      { tag: 'semaphore', categories: ['OS'] },
      { tag: 'operating system', categories: ['OS'] },
      { tag: 'deadlock', categories: ['OS'] },
      { tag: 'virtual memory', categories: ['OS'] },

      // ==========================
      // Operating Systems – Advanced
      // ==========================
      { tag: 'mutex', categories: ['OS'] },
      { tag: 'ipc', categories: ['OS'] },
      { tag: 'context switching', categories: ['OS'] },
      { tag: 'bankers algorithm', categories: ['OS'] },
      { tag: 'paging', categories: ['OS'] },
      { tag: 'segmentation', categories: ['OS'] },
      { tag: 'tlb', categories: ['OS'] },
      { tag: 'copy on write', categories: ['OS'] },
      { tag: 'system calls', categories: ['OS'] },
      { tag: 'linux scheduling', categories: ['OS'] },

      // ==========================
      // Networking – Expand
      // ==========================
      { tag: 'tcp', categories: ['Networking'] },
      { tag: 'udp', categories: ['Networking'] },
      { tag: 'http', categories: ['Networking'] },
      { tag: 'https', categories: ['Networking', 'Security'] },
      { tag: 'tls', categories: ['Networking', 'Security'] },
      { tag: 'ssl', categories: ['Networking', 'Security'] },
      { tag: 'websocket', categories: ['Networking'] },
      { tag: 'reverse proxy', categories: ['Networking', 'System Design'] },
      { tag: 'forward proxy', categories: ['Networking'] },
      { tag: 'nat', categories: ['Networking'] },
      { tag: 'icmp', categories: ['Networking'] },
      { tag: 'packet fragmentation', categories: ['Networking'] },

      // ==========================
      // System Design – Expand
      // ==========================
      { tag: 'load balancing', categories: ['System Design'] },
      { tag: 'caching', categories: ['System Design'] },
      { tag: 'scalability', categories: ['System Design'] },
      { tag: 'microservices', categories: ['System Design'] },
      { tag: 'replication', categories: ['System Design', 'Database'] },
      { tag: 'sharding', categories: ['System Design', 'Database'] },
      { tag: 'distributed', categories: ['System Design', 'Distributed Systems'] },
      { tag: 'dns', categories: ['System Design', 'Networking'] },
      { tag: 'cdn', categories: ['System Design'] },
      { tag: 'message queue', categories: ['System Design'] },
      { tag: 'api gateway', categories: ['System Design'] },
      { tag: 'event driven architecture', categories: ['System Design'] },
      { tag: 'circuit breaker', categories: ['System Design'] },
      { tag: 'saga pattern', categories: ['System Design'] },
      { tag: 'consistent hashing', categories: ['System Design'] },
      { tag: 'leader election', categories: ['Distributed Systems'] },
      { tag: 'raft', categories: ['Distributed Systems'] },
      { tag: 'paxos', categories: ['Distributed Systems'] },
      { tag: 'vector clocks', categories: ['Distributed Systems'] },
      { tag: 'byzantine fault tolerance', categories: ['Distributed Systems'] },

      // ==========================
      // Web Development – Core
      // ==========================
      { tag: 'javascript', categories: ['Web Development'] },
      { tag: 'react', categories: ['Web Development'] },
      { tag: 'node', categories: ['Web Development'] },
      { tag: 'html', categories: ['Web Development'] },
      { tag: 'css', categories: ['Web Development'] },
      { tag: 'frontend', categories: ['Web Development'] },
      { tag: 'backend', categories: ['Web Development'] },
      { tag: 'api', categories: ['Web Development'] },
      { tag: 'rest', categories: ['Web Development'] },
      { tag: 'graphql', categories: ['Web Development'] },

      // ==========================
      // Web Development – Expand
      // ==========================
      { tag: 'typescript', categories: ['Web Development'] },
      { tag: 'nextjs', categories: ['Web Development'] },
      { tag: 'authentication', categories: ['Web Development', 'Security'] },
      { tag: 'jwt', categories: ['Web Development', 'Security'] },
      { tag: 'oauth', categories: ['Security'] },
      { tag: 'session management', categories: ['Web Development'] },
      { tag: 'mvc', categories: ['Web Development'] },
      { tag: 'cors', categories: ['Web Development', 'Security'] },

      // ==========================
      // AI / ML – Add Pillar Mapping
      // ==========================
      { tag: 'transformers', categories: ['AI/ML'] },
      { tag: 'rag', categories: ['AI/ML'] },
      { tag: 'embeddings', categories: ['AI/ML'] },
      { tag: 'llm', categories: ['AI/ML'] },
      { tag: 'prompt engineering', categories: ['AI/ML'] },
      { tag: 'cnn', categories: ['AI/ML'] },
      { tag: 'reinforcement learning', categories: ['AI/ML'] },
      { tag: 'quantization', categories: ['AI/ML'] },
      { tag: 'machine learning', categories: ['AI/ML'] },
      { tag: 'ai', categories: ['AI/ML'] },

      // ==========================
      // Security – Expand
      // ==========================
      { tag: 'xss', categories: ['Security'] },
      { tag: 'csrf', categories: ['Security'] },
      { tag: 'sql injection', categories: ['Security', 'Database'] },
      { tag: 'bcrypt', categories: ['Security'] },
      { tag: 'argon2', categories: ['Security'] },
      { tag: 'pki', categories: ['Security'] },
      { tag: 'zero trust', categories: ['Security'] },

      // ==========================
      // Cloud & DevOps
      // ==========================
      { tag: 'aws', categories: ['Cloud'] },
      { tag: 'azure', categories: ['Cloud'] },
      { tag: 'gcp', categories: ['Cloud'] },
      { tag: 'docker', categories: ['DevOps'] },
      { tag: 'kubernetes', categories: ['DevOps'] },
      { tag: 'ci cd', categories: ['DevOps'] },
      { tag: 'terraform', categories: ['DevOps'] },
      { tag: 'serverless', categories: ['Cloud'] },
      { tag: 'blue green deployment', categories: ['DevOps'] },
      { tag: 'canary deployment', categories: ['DevOps'] },

      // ==========================
      // Low Level & Performance
      // ==========================
      { tag: 'cpu cache', categories: ['Low Level'] },
      { tag: 'false sharing', categories: ['Low Level'] },
      { tag: 'memory alignment', categories: ['Low Level'] },
      { tag: 'lock free programming', categories: ['Low Level'] },
      { tag: 'simd', categories: ['Low Level'] },
      { tag: 'latency', categories: ['Low Level'] },
      { tag: 'throughput', categories: ['Low Level'] }
    ];

    // Prepare bulk operations
    const bulkOps = mappings.map((mapping) => ({
      updateOne: {
        filter: { tag: mapping.tag.toLowerCase().trim() },
        update: { 
          $set: { 
            categories: mapping.categories,
            weight: mapping.weight || 1
          } 
        },
        upsert: true,
      },
    }));

    // Execute bulkWrite
    const result = await CategoryMapping.bulkWrite(bulkOps);

    console.log('📊 Sync Results:');
    console.log(` - Matched: ${result.matchedCount}`);
    console.log(` - Modified: ${result.modifiedCount}`);
    console.log(` - Upserted: ${result.upsertedCount}`);
    console.log('✅ Category Mappings synced successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
};

seedCategoryMappings();
