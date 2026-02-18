# LearnSphere AI 🚀
> **The Ultimate Intelligent Learning Platform**

**LearnSphere AI** is an advanced, AI-powered educational ecosystem designed to streamline the journey from beginner to expert. By combining **Large Language Models (Gemini, Llama-3)**, **Vector Search (RAG)**, and **Redis-backed Performance Optimization**, it delivers personalized roadmaps, high-fidelity coding practice, and a verified knowledge library—all tracked via a gamified Analytics engine.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [⚡ Performance & Database Optimization](#-performance--database-optimization)
- [🛡️ Admin & Control Engine](#️-admin--control-engine)
- [🧠 Core Modules Detailed](#-core-modules-detailed)
  - [1. Personalized AI Roadmaps](#1-personalized-ai-roadmaps)
  - [2. Coding Arena & Judge System](#2-coding-arena--judge-system)
  - [3. Knowledge Base (Docs 2.0)](#3-knowledge-base-docs-20)
  - [4. RAG Engine (PDF Analysis)](#4-rag-engine-pdf-analysis)
- [🧪 Testing & Benchmarking](#-testing--benchmarking)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Rapid Deployment](#-rapid-deployment)
- [🔑 Environment Configuration](#-environment-configuration)

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **AI Roadmap Architect** | Generates 8-15 module progressive paths with real video & doc verification. |
| **RAG Study Material** | Upload PDFs to generate custom curricula based strictly on your documents. |
| **Coding Arena** | Monaco-powered editor with real-time C++, Python, and JS execution. |
| **Knowledge Base** | High-density docs with ELI5 intuition, complexity analysis, and code snippets. |
| **Dynamic Analytics** | Real-time mastery tracking through quizzes and roadmap completion. |
| **AI Tutor Chat** | 1-on-1 real-time tutoring using Llama-3 (Groq) with conversation memory. |
| **Admin OS** | Fully integrated CRUD dashboard with AI content generation tools. |

---

## ⚡ Performance & Database Optimization
*Engineered for scale and millisecond latency.*

### 1. Redis Caching (Upstash)
We implement a **multi-tier caching strategy** using Redis to reduce MongoDB load by ~85%:
- **Knowledge Base Detail**: Individual topic pages cached for 1 hour.
- **Community Roadmaps**: Public list cached for 30 minutes; individual details for 1 hour.
- **Analytics Overview**: Heavy aggregation results cached for 10 minutes per user.
- **Problem Lists**: Paginated search results cached for 10 minutes.

### 2. Advanced MongoDB Indexing
Optimized query execution using compound and text indexes:
- `Roadmap`: `{ user: 1, createdAt: -1 }` for instant dashboard loads.
- `Submission`: `{ user: 1, question: 1, status: 1 }` for checking problem solve status.
- `QuizAttempt`: `{ user: 1, roadmap: 1 }` for module completion checks.

### 3. Query Efficiency
- **Lean Queries**: All read-only operations use `.lean()` to bypass Mongoose hydration overhead.
- **Partial Projections**: Fetching only required fields (`.select()`) to minimize network payload.
- **Standardized Pagination**: Uniform `page` and `limit` (default 15) across all Admin and Library endpoints.

---

## 🛡️ Admin & Control Engine
*The power to manage an entire curriculum.*

The **Admin Dashboard** provides a professional-grade interface for content curators:
- **Problem Management**: Create, Edit, or **AI-Generate** coding problems including test cases and starter code.
- **Knowledge Library**: Bulk manage documentation. Includes an **AI Knowledge Generator** that creates 500+ word deep-dives, ELI5 intuition, and complexity markers.
- **Roadmap Operations**: Create official roadmaps or "Officialize" community-generated ones.
- **Validation Suite**: Built-in logic to test and validate problem correctness before publishing.

---

## 🧠 Core Modules Detailed

### 1. Personalized AI Roadmaps
Unlike standard AI lists, LearnSphere roadmaps are **Hyper-Linked Ecosystems**:
- **Resource Sourcing**: Dynamically fetches the top 2-4 YouTube tutorials for every module.
- **Library Integration**: Automatically links module topics to our internal **Knowledge Base** entries.
- **Effort Estimation**: Provides reading and practice time estimates (minutes) for every module.
- **Unlock Criteria**: Gamified gating ensuring users master a module (Quiz 70%+) before proceeding.

### 2. Coding Arena & Judge System
Integrated with **Judge0** for high-performance code execution:
- **Languages**: Full support for `JavaScript`, `Python`, and `C++`.
- **Infrastructure**: Test case runner that compares `STDOUT` against expected outputs with precision.
- **Feedback**: Instant pass/fail status with detailed error logs and time/memory execution metrics.

### 3. Knowledge Base (Docs 2.0)
Our knowledge nodes are more than just text:
- **Intuition (ELI5)**: Real-world analogies for complex concepts (e.g., "Think of a Hash Table like a Library Catalog").
- **Multi-Lang Examples**: Most topics include code in 3+ languages.
- **Complexity Analysis**: Big O time and space complexity clearly tagged for interview prep.
- **Further Reading**: Curated links to official MDN, GeeksForGeeks, or documentation.

---

## 🧪 Testing & Benchmarking
We take performance seriously. Use these scripts to verify your setup:

- **`verifyDbSetup.js`**: Checks MongoDB index presence and Redis connectivity.
- **`dbBenchmark.js`**: Measures API response times (Cold vs. Warm cache) for Analytics, Library, and Roadmaps.
- **`geminiStressTest.js`**: Validates AI API rate-limiting handling and key rotation.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Framer Motion, Tailwind CSS, Lucide React, Monaco Editor. |
| **Backend** | Node.js, Express, Mongoose, ioredis. |
| **AI Models** | Google Gemini 2.0 Flash, Meta Llama 3.3 (Groq). |
| **Database/Cache** | MongoDB Atlas, Upstash Redis. |
| **Execution** | Judge0 API (Remote Compiler). |

---

## 🚀 Rapid Deployment

### 1. Backend Prep
```bash
cd backend
npm install
# Configure .env (see below)
node scripts/seedMappings.js   # Populate Skill Tree categories
node scripts/seedKnowledge.js # Populate initial Knowledge Base
npm run dev
```

### 2. Frontend Prep
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Configuration
Create `backend/.env` with the following:

```env
# Infrastructure
PORT=5001
MONGO_URI=your_mongodb_uri
REDIS_URL=your_upstash_redis_url
JWT_SECRET=your_super_secret_key

# AI Configuration
GEMINI_API_KEYS=key1,key2,key3 # Comma-separated for rotation
GROQ_API_KEY=your_key           # General AI
TUTOR_GROQ_API_KEY=your_key     # High-priority Tutor Chat key

# External Services
YOUTUBE_API_KEY=your_key
JUDGE0_BASE_URL=https://ce.judge0.com        # Default public instance
JUDGE0_API_KEY=your_key                       # OPTIONAL (For RapidAPI/Private instances)
```

---
*Created with ❤️ by the LearnSphere AI Team.*
