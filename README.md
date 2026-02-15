# LearnSphere AI 🚀

> **LearnSphere AI** is a next-generation local-first learning platform that leverages state-of-the-art AI (Gemini/Groq) to generate personalized roadmaps, RAG-driven curriculum from PDFs, and dynamic assessments — all unified under a gamified, tag-based Skill Tree.

---

## 📑 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Detailed Technical Implementation](#detailed-technical-implementation)
  - [Personalized AI Roadmap Generation](#1-personalized-ai-roadmap-generation)
  - [RAG-Enabled Roadmaps (Study Material Analysis)](#2-rag-enabled-roadmaps)
  - [Dynamic Quiz Assessment System](#3-dynamic-quiz-assessment-system)
  - [Learning Analytics & Dynamic Skill Tree](#4-learning-analytics--dynamic-skill-tree)
  - [AI Tutor Chat (Streaming)](#5-ai-tutor-chat)
  - [Resource Library (Independent Search)](#6-resource-library-independent-search)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [API Endpoints](#api-endpoints)
- [Testing & Scripts](#testing--scripts)
- [Troubleshooting](#troubleshooting)
- [Future Roadmap](#future-roadmap)

---

## 🏁 Project Overview
LearnSphere AI is designed to solve the "Paradox of Choice" in online learning. Instead of browsing thousands of courses, users provide a topic or a document, and the platform constructs a validated, high-quality learning journey. It bridges the gap between raw AI output and verified educational content by integrating real-world resources (YouTube, Official Docs) and tracking mastery via a dynamic Skill Tree.

---

## ✨ Key Features
- 🎓 **AI Tutor Chat** — Real-time 1-on-1 tutoring with Groq LLM (Llama-3).
- 🗺️ **Personalized Roadmaps** — 8-module progressive paths generated via Gemini 1.5.
- 📄 **RAG Roadmap (New)** — Upload your own PDFs to generate a curriculum based strictly on your document.
- 📚 **Resource Library** — Search for tutorials and articles independently of roadmaps.
- 📊 **Dynamic Skill Tree** — Gamified visualization of your technical growth.
- 📝 **AI Quiz System** — Dynamic assessments that generate questions based on your specific learning module.
- 🔐 **Secure JWT Auth** — Protected routes and personalized data syncing.
- 🔍 **Explorer Gallery** — Share your roadmaps with the community or clone theirs.

---

## 🧠 Detailed Technical Implementation

### 1. Personalized AI Roadmap Generation
**Problem:** Most AI roadmaps provide broken links and generic descriptions.
**Implementation:** 
- **The Engine**: Uses `geminiService.js` to process topic queries.
- **Precision Validation**: A proprietary sanitization layer checks every suggested URL. If the AI provides a "placeholder" or broken link, the system executes a **Scoped Google Search** (e.g., `site:docs.python.org + [topic]`) or defaults to verified domains like GeeksForGeeks or MDN.
- **Multi-Media Integration**: Each module in the roadmap is enriched with a `searchYouTubeVideos` service call that anchors queries using module titles AND `keyConcepts` for high-precision results.

### 2. RAG-Enabled Roadmaps (Study Material)
**Problem:** Generic AI doesn't know about your specific lecture notes or proprietary docs.
**Implementation:**
- **Parsing**: Uses `pdf-parse` for robust text extraction.
- **Contextual Curriculum**: `ragService.js` builds a unique prompt that feeds extracted text into Gemini, tasking it to act as an "Educational Architect" that extracts 7-10 modules *exclusively* from the provided text.
- **Reliability**: Prevents a user's roadmap from drifting into external topics, ensuring it's a perfect companion for specific exam preparation.

### 3. Dynamic Quiz Assessment System
**Functionality:** Assessments that actually match what you just studied.
**Implementation:**
- **On-Demand Generation**: When you click "Take Quiz", `quizController.js` identifies the module title & parent topic.
- **Grounding Switch**: The system can toggle between "General Knowledge" (pure LLM) and "Knowledge-Based" (pulling from our internal Knowledge Node database) to ensure quiz correctness.
- **Scoring Engine**: Evaluates JSON payloads of answers, calculates percentage, and stores results in a `QuizAttempt` collection to fuel your "Weak Areas" analysis.

### 4. Learning Analytics & Dynamic Skill Tree
**Problem:** How do you map 10,000 possible topics into 5 core levels?
**Implementation:**
- **Category Mappings**: Uses a `CategoryMapping` model with over 150+ expert-defined tags (e.g., "b-tree" -> DSA, "mutex" -> OS).
- **Fuzzy Attribution Engine**: The `analyticsController.js` uses a set-based intersection logic. If your roadmap title or module title contains any known tags, that progress is "attributed" to the parent pillar.
- **Production-Safe Seeder**: `seedMappings.js` uses MongoDB `bulkWrite` with `upsert: true` to allow frequent tag updates without ever deleting existing user progress.
- **Visuals**: React component `SkillTree.jsx` calculates SVG `strokeDasharray` on the fly to show smooth, hexagonal progress bars with theme-responsive glassmorphism.

### 5. AI Tutor Chat (Streaming)
**Implementation:**
- **Low Latency**: Utilizes Groq Cloud with `llama-3.3-70b-versatile`.
- **Session Context**: The frontend `TutorChat.jsx` maintains a message state that is sent with every request to maintain conversation history.
- **Streaming**: Implemented using basic POST/long-polling or standard JSON responses (planned migration to Server-Sent Events).

---

## 🛠 Tech Stack
- **Frontend**: 
  - React 18 (Vite)
  - Tailwind CSS (Premium Glassmorphism Design)
  - Framer Motion (Planned for micro-animations)
  - Axios (API Communication)
- **Backend**: 
  - Node.js & Express
  - MongoDB (via Mongoose)
  - JWT (Authentication & Security)
- **AI Infrastructure**: 
  - Google Gemini 1.5 Flash (Roadmap/Quiz engine)
  - Groq Cloud (Llama-3 Tutor engine)
- **APIs**: 
  - YouTube Data API v3 (Resource sourcing)

---

## � Repository Structure
```bash
├── backend/
│   ├── config/           # DB connections and Provider settings
│   ├── controllers/      # Business logic (Auth, Analytics, Quiz, etc.)
│   ├── middleware/       # Auth protection, Request validation
│   ├── models/           # Mongoose Schemas (User, Roadmap, QuizAttempt, Mappings)
│   ├── routes/           # RESTful API Endpoints
│   ├── services/         # Core AI logic (Gemini, Groq, YouTube, RAG)
│   └── seedMappings.js   # Skill Tree topic database seeder
├── frontend/
│   ├── src/
│   │   ├── components/   # UI Elements (SkillTree, Navbar, RoadmapCard)
│   │   ├── pages/        # Dashboard, Tutor, Explore, Analytics
│   │   ├── services/     # Frontend API wrappers
│   │   └── utils/        # Formatters and theme helpers
```

---

## 🔑 Environment Variables
Create a `.env` in the `backend/` folder:
```env
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# AI Keys
GEMINI_API_KEYS=key1,key2      # Supports rotation
YOUTUBE_API_KEY=your_key
GROQ_API_KEY=your_groq_key     # For Roadmaps
TUTOR_GROQ_API_KEY=your_key    # Dedicated key for Tutor (Rate-Limit protection)
```

---

## 🚀 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Valid API keys for Gemini/YouTube.

### 2. Backend Initialization
```bash
cd backend
npm install
# [Configure .env]
node seedMappings.js  # CRITICAL: This links roadmap topics to the Skill Tree
node server.js
```

### 3. Frontend Initialization
```bash
cd frontend
npm install
npm run dev
```

---

## � API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate & get JWT

### Roadmaps
- `POST /api/roadmaps/generate` - Generate AI roadmap
- `POST /api/roadmaps/rag` - Generate roadmap from PDF context
- `GET /api/roadmaps/public/list` - Fetch community roadmaps
- `POST /api/roadmaps/:id/clone` - Copy a public roadmap to your account

### Quizzes
- `POST /api/quizzes/generate` - Create dynamic questions
- `POST /api/quizzes/submit` - Submit answers & update Skill Tree progress

---

## 🧪 Testing & Scripts
Use the built-in test runners to verify integrations:
- `node backend/test-gemini.js` - Validates AI availability.
- `node backend/test-youtube.js` - Validates video sourcing.
- `node backend/testAPIs.js` - End-to-end API route check.

---

## � Troubleshooting
- **Skill Tree is 0%**: Did you run `node backend/seedMappings.js`? The system needs the tag database to map topics.
- **Roadmap Generation Fails**: Check if you have hit the Gemini Free Tier rate limits (implemented with key rotation in the backend to mitigate this).
- **Invalid Dates**: Ensure you are using a modern browser (Chrome 110+) for proper Intl date parsing.

---

## � Future Roadmap
- [ ] **Collaborative Roadmaps**: Multi-user editing.
- [ ] **Flashcard Support**: Automatically generate Anki-style cards from roadmap modules.
- [ ] **Mobile App**: React Native port for learning on the go.
- [ ] **Community Ratings**: Upvote/Downvote the best public roadmaps.

---

## 📄 License
This project is for educational purposes. All AI models used are subject to their respective provider terms (Google/Groq).
