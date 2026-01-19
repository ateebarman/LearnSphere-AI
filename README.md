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

LearnSphere AI is a full-stack learning platform prototype with a Node.js + Express backend and a Vite + React frontend. The backend exposes REST endpoints for authentication, quizzes, roadmaps, resources, and analytics, and integrates with AI services (Gemini) and the YouTube API.

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

- `PORT` — port for backend server (default 3000)
- `MONGODB_URI` or `DATABASE_URL` — connection string for the DB
- `JWT_SECRET` — secret used for signing JWT tokens for auth
- `GEMINI_API_KEY` — (optional) API key used by `backend/services/geminiService.js`
- `YOUTUBE_API_KEY` — (optional) API key for YouTube integration

Adjust names to match how `backend/config/db.js` and other modules read env vars (check that file for exact variable names).

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

This section lists each user-facing and backend feature, what it does today, how it's implemented (file locations and flow), and planned improvements (what will be done later).

- **Authentication (signup / login / JWT)**
  - What it does: register users, authenticate, issue JWTs, protect routes.
  - Implemented in: [backend/routes/authRoutes.js](backend/routes/authRoutes.js), [backend/controllers/authController.js](backend/controllers/authController.js), [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js)
  - How it works: signup stores user records via `userModel` in `backend/models/userModel.js`, passwords are hashed (check `authController.js`), login verifies credentials and issues a signed JWT using `JWT_SECRET`. Protected routes use `authMiddleware` to verify tokens and attach `req.user`.
  - Later: add refresh tokens, email verification, OAuth providers (Google/GitHub), account recovery flows.

- **Quiz Management & Attempts**
  - What it does: fetch quizzes, submit answers, store attempts and calculate results.
  - Implemented in: [backend/routes/quizRoutes.js](backend/routes/quizRoutes.js), [backend/controllers/quizController.js](backend/controllers/quizController.js), [backend/models/quizAttemptModel.js](backend/models/quizAttemptModel.js)
  - How it works: quiz endpoints return question sets; when a user submits answers, the controller evaluates correctness, stores an attempt document, and returns scores. Score calculation and partial scoring logic live in `quizController.js`.
  - Later: add timed quizzes, question pools, adaptive difficulty, analytics hooks to track item-level performance.

- **Roadmaps (learning paths)**
  - What it does: list and manage roadmaps (learning paths) with modules and progress tracking.
  - Implemented in: [backend/routes/roadmapRoutes.js](backend/routes/roadmapRoutes.js), [backend/controllers/roadmapController.js](backend/controllers/roadmapController.js), [backend/models/roadmapModel.js](backend/models/roadmapModel.js)
  - How it works: roadmap documents describe ordered modules and resources. Controller endpoints support reading, updating, and user progress updates.
  - Later: add collaborative editing, versioning, module-level assessments and auto-generated module suggestions via AI.

- **Resources (links, docs, attachments)**
  - What it does: CRUD for supplemental resources (articles, videos, links) used across roadmaps and modules.
  - Implemented in: [backend/routes/resourceRoutes.js](backend/routes/resourceRoutes.js), [backend/controllers/resourceController.js](backend/controllers/resourceController.js)
  - How it works: resource endpoints accept metadata (title, type, url) and return paginated lists. Frontend `roadmapService` / `resourceService` consume these.
  - Later: add tagging, full-text search, user bookmarks, and moderation workflows.

- **Analytics & Events**
  - What it does: collect usage events (page views, quiz starts/completions), aggregate metrics.
  - Implemented in: [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js), [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js), frontend analytics calls in `frontend/src/services/analyticsService.js`
  - How it works: client sends event payloads to analytics endpoints; controller persists or forwards to an analytics pipeline. Basic aggregation endpoints compute counts and trends.
  - Later: export to external analytics (e.g., Mixpanel, Amplitude), add dashboards and scheduled reports.

- **Gemini AI Integration**
  - What it does: query Gemini for AI-driven content (explanations, suggestions, code examples).
  - Implemented in: [backend/services/geminiService.js](backend/services/geminiService.js) and used by controllers that require AI outputs.
  - How it works: service wraps Gemini API calls; controllers pass prompts and receive generated text which can be persisted or returned to clients. Requires `GEMINI_API_KEY`.
  - Later: implement prompt templates, caching of AI responses, cost tracking, and a queue for long-running generation tasks.

- **YouTube Integration**
  - What it does: search YouTube for relevant videos and surface them in resources/roadmaps.
  - Implemented in: [backend/services/youtubeService.js](backend/services/youtubeService.js) and `test-youtube.js` for verification.
  - How it works: service calls YouTube Data API using `YOUTUBE_API_KEY`, normalizes results and returns a concise resource object (title, channel, url, thumbnail).
  - Later: add automatic transcript fetching, matching video segments to roadmap modules, and caching.

- **Middleware & Validation**
  - What it does: centralize error handling, input validation, and authentication enforcement.
  - Implemented in: [backend/middleware/validationMiddleware.js](backend/middleware/validationMiddleware.js), [backend/middleware/errorMiddleware.js](backend/middleware/errorMiddleware.js)
  - How it works: routes attach validators; middleware transforms thrown errors into consistent HTTP responses and logs stack traces.
  - Later: integrate schema validation with OpenAPI or Zod, add request tracing and structured logs.

- **Data Models (summary)**
  - `userModel.js`: users, credentials, profile fields, roles.
  - `quizAttemptModel.js`: references to user, quiz, answers, score, timestamps.
  - `roadmapModel.js`: ordered modules, resources per module, metadata.
  - Later: expand schemas with indexes for performance and additional relations.

**Examples: Common Flows**

- Signup / Login (curl)

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

**Future Work / Roadmap (what will be done later)**

- Authentication: refresh tokens, OAuth, email verification, stronger password policies.
- Quizzes: timed tests, adaptive difficulty, item response theory (IRT) analytics, richer item types (coding exercises with run/eval).
- Roadmaps: auto-generated module suggestions via AI, module-level progress tracking and assessments, public/private roadmap variants.
- AI: response caching, prompt library, usage / cost dashboard, streaming responses for large outputs.
- Search & Discovery: add full-text search across resources, rankings, and personalization signals.
- Observability: structured logging, tracing, metrics endpoints, health checks, error alerting.
- DevOps: Dockerfiles for backend and frontend, CI workflows, automated tests and linting.

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

