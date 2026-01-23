# LearnSphere AI

> LearnSphere AI — an educational backend + frontend starter that integrates AI services (Gemini), YouTube search, quizzes, roadmaps, and analytics.

---

**Table of Contents**

- **Project Overview**
- **Tech Stack**
- **Repository Structure**
- **Prerequisites**
- **Environment Variables**
- **Local Setup**
  - Backend
  - Frontend
- **Scripts & Useful Commands**
- **API Endpoints (overview)**
- **Testing**
- **Development Workflow**
- **Troubleshooting**
- **Contributing**
- **License**

---

**Project Overview**

LearnSphere AI is a full-stack learning platform with a Node.js + Express backend and a Vite + React frontend. It integrates AI services (Gemini & Groq), YouTube search, quizzes, roadmaps, analytics, and a community roadmap gallery. Users can generate personalized learning roadmaps, chat with an AI tutor, search learning resources, and share/clone public roadmaps.

**Key Features**

- 🎓 **AI Tutor Chat** — Real-time tutoring with Groq LLM (llama-3.3-70b-versatile)
- 📚 **Resource Library** — Search and browse learning resources (videos + articles) independently
- 🗺️ **Roadmap Gallery** — Explore, clone, and share public learning roadmaps
- 📝 **Quiz System** — AI-generated quizzes with progress tracking
- 📊 **Analytics** — Track user engagement and learning progress
- 🔐 **JWT Authentication** — Secure user accounts and protected routes
- 🎯 **Personalized Roadmaps** — AI-generated learning paths with YouTube videos

**Tech Stack**

- Backend: Node.js, Express
- Frontend: Vite, React
- Database: (project uses a DB connector in `backend/config/db.js`) — typically MongoDB (provide URI via env)
- External: Gemini AI (via `backend/services/geminiService.js`), YouTube (via `backend/services/youtubeService.js`)

**Repository Structure**

- `backend/` — Express server, controllers, models, routes, services
  - `server.js` — backend entry point
  - `config/db.js` — DB connection helper
  - `controllers/` — route handlers (analytics, auth, quiz, resource, roadmap)
  - `routes/` — route definitions (see `backend/routes/`)
  - `services/` — integration services (`geminiService.js`, `youtubeService.js`)
  - `models/` — Mongoose-style models (users, quiz attempts, roadmaps)
  - `middleware/` — auth, validation, error handling
  - test scripts: `test-api.js`, `test-gemini.js`, `test-youtube.js`, `testAPIs.js`

- `frontend/` — React + Vite app
  - `src/` — source (components, pages, services)
  - `public/` — static assets
  - `package.json` — frontend scripts
  - `README.md` — frontend-specific notes

Top-level files

- `API_STATUS_REPORT.md`, `STATUS.txt`, `FIXES_APPLIED.md`, `TEST_GUIDE.md` — project notes and guides

**Prerequisites**

- Node.js 18+ (or current LTS)
- npm (or yarn)
- A database (MongoDB recommended) and connection URI
- Gemini API key (if using Gemini integrations)
- YouTube API key (for YouTube service)

**Environment Variables**

Create a `.env` file in `backend/` (or set env vars in whatever deployment environment you use). Typical variables:

```
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=AppName
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEYS=api_key1,api_key2,api_key3
YOUTUBE_API_KEY=your_youtube_api_key

# AI Provider Configuration (groq or gemini)
AI_PROVIDER=groq

# Groq Configuration
GROQ_API_KEY=gsk_your_groq_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

# Tutor Service - Separate Groq API Key
TUTOR_GROQ_API_KEY=gsk_your_tutor_groq_key
```

- `PORT` — port for backend server (default 5001)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `GEMINI_API_KEYS` — comma-separated Gemini API keys (for roadmap/quiz generation)
- `YOUTUBE_API_KEY` — YouTube Data API key
- `AI_PROVIDER` — set to 'groq' or 'gemini' for roadmap generation
- `GROQ_API_KEY` — Groq API key for roadmap/quiz generation
- `GROQ_BASE_URL` — Groq API endpoint
- `GROQ_MODEL` — Groq model to use (currently llama-3.3-70b-versatile)
- `TUTOR_GROQ_API_KEY` — Separate Groq key for AI Tutor (prevents rate limiting conflicts)

**Local Setup**

1. Backend

```bash
cd backend
npm install
# set environment variables (e.g. create .env)
# start server
node server.js
```

If you prefer a development server with live reload, install `nodemon` and run `npx nodemon server.js` (if not already available in `package.json`).

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

To build a production frontend bundle:

```bash
npm run build
```

**Scripts & Useful Commands**

- Run backend: `node backend/server.js` (or use `npm start` in `backend` if configured)
- Run frontend dev server: `cd frontend && npm run dev`
- Run frontend build: `cd frontend && npm run build`
- Run API tests / quick checks: `node backend/test-api.js` or `node backend/testAPIs.js` (there are several test scripts in `backend/`)

**API Endpoints (overview)**

The backend's routes are organized in `backend/routes/` and handled by `backend/controllers/`. High-level endpoints include:

- Authentication (`backend/routes/authRoutes.js`): signup, login, token refresh, etc.
- Quiz (`backend/routes/quizRoutes.js`): fetch quizzes, submit attempts, results
- Roadmap (`backend/routes/roadmapRoutes.js`): read and manage roadmaps
- Resources (`backend/routes/resourceRoutes.js`): resource listings
- Analytics (`backend/routes/analyticsRoutes.js`): usage and event analytics

Refer to the controllers for exact endpoint paths and request/response shapes:

- [backend/controllers/authController.js](backend/controllers/authController.js)
- [backend/controllers/quizController.js](backend/controllers/quizController.js)
- [backend/controllers/roadmapController.js](backend/controllers/roadmapController.js)
- [backend/controllers/resourceController.js](backend/controllers/resourceController.js)
- [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)

If you prefer a quick route list, open the `backend/routes/` folder:

- [backend/routes/authRoutes.js](backend/routes/authRoutes.js)
- [backend/routes/quizRoutes.js](backend/routes/quizRoutes.js)
- [backend/routes/roadmapRoutes.js](backend/routes/roadmapRoutes.js)
- [backend/routes/resourceRoutes.js](backend/routes/resourceRoutes.js)
- [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js)

**Testing**

The repo contains a few node scripts to exercise the APIs and external integrations. Example:

```bash
# Run available test scripts in backend
cd backend
node test-api.js
node test-gemini.js
node test-youtube.js
node testAPIs.js
```

Check the scripts to see what they validate and whether they require env vars (API keys, DB URI).

**Development Workflow**

- Start your DB (e.g., MongoDB instance or cloud DB) and export `MONGODB_URI`.
- Start backend: `node backend/server.js`
- Start frontend: `cd frontend && npm run dev`
- Make authenticated requests using a tool such as Postman or the included test scripts.
- When adding new environment-dependent features (AI / YouTube), add the required keys to `.env.example` and document them here.

**Troubleshooting**

- If the server fails to connect to DB: verify `MONGODB_URI` and DB status.
- If auth fails: check `JWT_SECRET` consistency across environment and token creation/verification.
- If Gemini or YouTube integrations fail: ensure `GEMINI_API_KEY` and `YOUTUBE_API_KEY` are set and valid.
- Check logs from `backend/server.js` for stack traces and detailed errors.

**Contributing**

1. Fork the repo and create a feature branch
2. Add tests where relevant
3. Open a PR with a clear description of changes

Please follow existing code styles and run the test scripts before submitting a PR.

**License**

This project does not include an explicit license file in the repository. If you want an open-source license, consider adding an `MIT` or other OSI-approved license file.

---

If you'd like, I can:

- add a `.env.example` file with the variables above,
- create `README` sections with full example API requests for each route,
- run the backend test scripts now and report results.

Created: [README.md](README.md)
Created: [README.md](README.md)

**Detailed Features & Implementation**

This section lists each user-facing and backend feature, what it does, how it's implemented, and examples.

- **Authentication (signup / login / JWT)**
  - What it does: register users, authenticate, issue JWTs, protect routes.
  - Implemented in: [backend/routes/authRoutes.js](backend/routes/authRoutes.js), [backend/controllers/authController.js](backend/controllers/authController.js), [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js)
  - How it works: signup stores user records with hashed passwords; login verifies credentials and issues a signed JWT. Protected routes use `authMiddleware` to verify tokens.
  - Later: add refresh tokens, OAuth, email verification, account recovery flows.

- **AI Tutor Chat** ⭐ NEW
  - What it does: real-time 1-on-1 tutoring with an AI powered by Groq LLM.
  - Implemented in: [backend/services/grokTutorService.js](backend/services/grokTutorService.js), [backend/controllers/tutorController.js](backend/controllers/tutorController.js), [backend/routes/tutorRoutes.js](backend/routes/tutorRoutes.js)
  - Frontend: [frontend/src/pages/TutorChat.jsx](frontend/src/pages/TutorChat.jsx), [frontend/src/services/tutorService.js](frontend/src/services/tutorService.js)
  - How it works: authenticated users send messages to `/api/tutor` endpoint; service calls Groq API (llama-3.3-70b-versatile) with conversation history; responses stream back in real-time.
  - API: `POST /api/tutor` (protected) — sends `{ message, history }` and returns tutoring response.
  - Environment: Uses separate `TUTOR_GROQ_API_KEY` to avoid rate-limit conflicts with roadmap generation.
  - UI: Chat interface with message history, loading states, error handling, and auto-scroll.

- **Resource Library** ⭐ NEW
  - What it does: search and browse learning resources (YouTube videos + AI articles) independently of roadmaps.
  - Frontend: [frontend/src/pages/ResourceLibrary.jsx](frontend/src/pages/ResourceLibrary.jsx), [frontend/src/services/resourceService.js](frontend/src/services/resourceService.js)
  - How it works: users search a topic via `/api/resources/:topic` endpoint; results split into Videos and Articles sections. Suggested topics provide quick-start chips.
  - UI: search bar, suggested topic chips, cards with thumbnails, channels, snippets, and "Open" buttons.
  - Empty states: before search shows "Search for a topic to get started"; after search with no results shows "No results found".
  - Navigation: "📚 Resources" link in navbar for authenticated users.

- **Public Roadmap Gallery (Explore)** ⭐ NEW
  - What it does: browse community roadmaps, view details, and clone into personal account.
  - Frontend: [frontend/src/pages/Explore.jsx](frontend/src/pages/Explore.jsx)
  - Backend: New endpoints in [backend/routes/roadmapRoutes.js](backend/routes/roadmapRoutes.js), functions in [backend/controllers/roadmapController.js](backend/controllers/roadmapController.js)
  - How it works:
    - Roadmap owners can toggle visibility (public/private) via "Make Public/Make Private" button in [frontend/src/pages/RoadmapView.jsx](frontend/src/pages/RoadmapView.jsx)
    - `GET /api/roadmaps/public/list` — fetch all public roadmaps (no auth required)
    - `PUT /api/roadmaps/:id/visibility` — toggle public/private (protected, owner only)
    - `POST /api/roadmaps/:id/clone` — clone roadmap to user's account (protected)
  - UI: grid of roadmap cards with title, topic, description, creator info, "View" and "Clone" buttons.
  - Cloned roadmaps default to private and are created as separate documents in user's account.
  - Navigation: "🔍 Explore" link in navbar (public route, no auth required).

- **Roadmap Management** (Enhanced)
  - What it does: generate, list, view, and manage learning roadmaps with modules and resources.
  - Enhanced with: `isPublic` field, visibility toggling, and cloning capability.
  - Model: [backend/models/roadmapModel.js](backend/models/roadmapModel.js) — now includes `isPublic: { type: Boolean, default: false }`
  - Controller: [backend/controllers/roadmapController.js](backend/controllers/roadmapController.js)
  - Routes: [backend/routes/roadmapRoutes.js](backend/routes/roadmapRoutes.js)
  - How it works: roadmaps contain ordered modules with resources (videos, articles, docs). AI generates roadmaps from topics; YouTube search enhances with videos.
  - New logic: non-owners can view public roadmaps; owners can toggle visibility; cloning deep-copies roadmap content.

- **Quiz Management & Attempts**
  - What it does: fetch quizzes, submit answers, store attempts and calculate results.
  - Implemented in: [backend/routes/quizRoutes.js](backend/routes/quizRoutes.js), [backend/controllers/quizController.js](backend/controllers/quizController.js), [backend/models/quizAttemptModel.js](backend/models/quizAttemptModel.js)
  - How it works: quiz endpoints return question sets; user submits answers; controller evaluates correctness, stores attempt, and returns scores.

- **Resources (independent search)**
  - What it does: dynamically fetch learning resources by topic (YouTube videos + AI articles).
  - Backend: [backend/routes/resourceRoutes.js](backend/routes/resourceRoutes.js), [backend/controllers/resourceController.js](backend/controllers/resourceController.js)
  - How it works: `GET /api/resources/:topic` queries YouTube API and AI for relevant content; returns structured resource list.
  - Frontend integrates via Resource Library page for independent browsing.

- **Analytics & Events**
  - What it does: collect usage events and track learning progress.
  - Implemented in: [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js), [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)
  - How it works: client sends event payloads to analytics endpoints; controller aggregates and returns metrics.

- **Gemini AI Integration**
  - What it does: AI-driven roadmap generation, explanations, and content suggestions.
  - Implemented in: [backend/services/geminiService.js](backend/services/geminiService.js)
  - How it works: service wraps Gemini API; controllers pass prompts and receive generated content for roadmaps and quizzes.
  - Requires: `GEMINI_API_KEYS` environment variable.

- **Groq AI Integration** ⭐ NEW
  - What it does: roadmap generation and AI tutor chat via Groq LLM.
  - Implemented in: [backend/services/ai/providers/groq.client.js](backend/services/ai/providers/groq.client.js), [backend/services/grokTutorService.js](backend/services/grokTutorService.js)
  - Model: llama-3.3-70b-versatile (high performance for coding/technical topics)
  - Requires: `GROQ_API_KEY` (roadmaps), `TUTOR_GROQ_API_KEY` (tutor) — kept separate to prevent rate limiting.

- **YouTube Integration**
  - What it does: search YouTube for relevant videos; surface in roadmaps and resource library.
  - Implemented in: [backend/services/youtubeService.js](backend/services/youtubeService.js)
  - How it works: service calls YouTube Data API, normalizes results, returns structured resource objects (title, channel, url, thumbnail).
  - Requires: `YOUTUBE_API_KEY` environment variable.

**Frontend Pages**

- **Home** (`frontend/src/pages/Home.jsx`) — landing page with feature overview
- **Login** (`frontend/src/pages/Login.jsx`) — user authentication
- **Signup** (`frontend/src/pages/Signup.jsx`) — user registration
- **Dashboard** (`frontend/src/pages/Dashboard.jsx`) — user's learning roadmaps, quick access to features
- **RoadmapView** (`frontend/src/pages/RoadmapView.jsx`) — view roadmap details, modules, progress, toggle public/private (owner only)
- **QuizPage** (`frontend/src/pages/QuizPage.jsx`) — take quizzes generated from roadmap modules
- **Profile** (`frontend/src/pages/Profile.jsx`) — user settings and preferences
- **Analytics** (`frontend/src/pages/Analytics.jsx`) — learning metrics and progress charts
- **TutorChat** ⭐ NEW (`frontend/src/pages/TutorChat.jsx`) — AI tutor chat interface, real-time conversations
- **ResourceLibrary** ⭐ NEW (`frontend/src/pages/ResourceLibrary.jsx`) — search and browse learning resources
- **Explore** ⭐ NEW (`frontend/src/pages/Explore.jsx`) — browse public roadmaps, search, clone to personal account

**Frontend Navigation**

Navbar shows authenticated users:
- 📊 Dashboard
- 🎓 AI Tutor
- 📚 Resources
- 🔍 Explore
- 📊 Analytics
- Profile (with user name)
- Logout button

Non-authenticated users see:
- Sign In
- Sign Up

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"Secret123"}'

# Login -> returns JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"Secret123"}'
```

- Fetch protected resource (example)

```bash
curl http://localhost:3000/api/roadmaps \
  -H "Authorization: Bearer ${TOKEN}"
```

**Testing & Local Verification**

- Quick API checks: run the scripts in `backend/`:

```bash
cd backend
node test-api.js
node testAPIs.js
```

- Gemini and YouTube test scripts:

```bash
node test-gemini.js
node test-youtube.js
```

Ensure environment variables are set prior to running tests.

**Future Work / Roadmap**

- **AI Tutor**: support follow-up sessions, rate limiting, cost tracking, multi-language support
- **Roadmaps**: collaborative editing, version history, forking, ratings and reviews on public roadmaps
- **Analytics**: dashboards with charts, export reports, user cohort analysis
- **Search**: full-text search across roadmaps and resources, ranking algorithms
- **Recommendations**: personalized roadmap suggestions based on learning history
- **Mobile**: native mobile apps for iOS/Android
- **DevOps**: Docker containers, CI/CD pipelines, automated testing, staging environments

**How to Extend / Add a Feature (quick guide)**

1. Add route file under `backend/routes/` and controller under `backend/controllers/`.
2. Add Mongoose model in `backend/models/` if storage is required.
3. Add service under `backend/services/` for external integrations.
4. Protect routes with `authMiddleware` as needed and validate inputs with `validationMiddleware`.
5. Add unit/integration tests alongside `test-*.js` scripts and update `TEST_GUIDE.md`.

**Files to inspect for deeper understanding**

- [backend/server.js](backend/server.js) — app bootstrap
- [backend/config/db.js](backend/config/db.js) — DB connection
- [backend/controllers/authController.js](backend/controllers/authController.js)
- [backend/controllers/quizController.js](backend/controllers/quizController.js)
- [backend/services/geminiService.js](backend/services/geminiService.js)
- [frontend/src/services/api.js](frontend/src/services/api.js) — shared HTTP client usage

---




- run `node backend/test-gemini.js` and `node backend/test-youtube.js` and report outputs,
- scaffold `Dockerfile`s for backend and frontend.

