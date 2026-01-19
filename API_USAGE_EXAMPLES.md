# API Integration Guide - Unchanged Endpoints

All existing endpoints work **exactly the same**. No changes to your API contracts.

## Example Requests

### 1. Generate Roadmap

**Endpoint**: `POST /api/roadmaps/generate`

```bash
curl -X POST http://localhost:5001/api/roadmaps/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "React"}'
```

**Response** (same as before):
```json
{
  "title": "Learning React",
  "description": "A comprehensive learning path for mastering React",
  "modules": [
    {
      "title": "Introduction to React",
      "description": "Learn the basics of React including JSX, components, and props.",
      "estimatedTime": "3 hours",
      "resources": [
        {
          "title": "Official React Documentation",
          "type": "doc",
          "url": "https://react.dev"
        }
      ]
    }
  ]
}
```

**Behavior**:
- ✅ If `AI_PROVIDER=gemini` and `GEMINI_API_KEY` set → Gemini API
- ✅ If `AI_PROVIDER=groq` and `GROQ_API_KEY` set → Groq API  
- ✅ If no API keys set → Demo data
- ✅ If API fails → Automatic fallback to demo

### 2. Generate Quiz

**Endpoint**: `POST /api/quizzes/generate`

```bash
curl -X POST http://localhost:5001/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "moduleTitle": "State and Props",
    "topic": "React"
  }'
```

**Response** (same as before):
```json
{
  "questions": [
    {
      "question": "What is React?",
      "options": [
        "A library",
        "A framework",
        "A language",
        "A database"
      ],
      "correctAnswer": "A library"
    }
  ]
}
```

### 3. Get Quiz Recommendations

**Endpoint**: `POST /api/quizzes/recommendations`

```bash
curl -X POST http://localhost:5001/api/quizzes/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "moduleTitle": "React Hooks",
    "score": 75,
    "incorrectAnswers": ["useState", "useEffect"]
  }'
```

**Response**:
```json
{
  "feedback": "Great job! You scored 75% on the React Hooks quiz. You're on the right track! Try reviewing these areas to improve: useState, useEffect. Keep up the good work!"
}
```

### 4. Get Articles for Topic

**Endpoint**: `GET /api/resources/articles?topic=React`

```bash
curl http://localhost:5001/api/resources/articles?topic=React
```

**Response**:
```json
{
  "resources": [
    {
      "title": "Official React Documentation",
      "url": "https://react.dev",
      "description": "The official documentation for React...",
      "type": "doc"
    },
    {
      "title": "React Tutorial Guide",
      "url": "https://tutorial.example.com/react",
      "description": "Comprehensive tutorial guide...",
      "type": "article"
    }
  ]
}
```

## Environment Variables for Testing

### Test 1: Gemini with Real API

```bash
# .env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_key
```

```bash
npm start
# Will use real Gemini API
# Check logs: "Using Gemini API key 1 of 1"
```

### Test 2: Groq with Real API

```bash
# .env
AI_PROVIDER=groq
GROQ_API_KEY=your_real_groq_key
```

```bash
npm start
# Will use real Groq API
# Endpoints unchanged, responses identical format
```

### Test 3: Demo Mode (No API Keys)

```bash
# .env - remove all API keys
AI_PROVIDER=gemini
# (no GEMINI_API_KEY or GROQ_API_KEY)
```

```bash
npm start
# Will automatically return demo data
# Check logs: "Using DEMO mode for roadmap generation"
```

### Test 4: Multiple Gemini Keys

```bash
# .env
AI_PROVIDER=gemini
GEMINI_API_KEYS=key1,key2,key3
```

```bash
npm start
# Will rotate through keys
# Check logs: "Using Gemini API key 1 of 3", then "2 of 3", etc.
```

## Request/Response Flow

### With Real API
```
Request
  ↓
geminiService.generateRoadmapFromAI(topic)
  ↓
generateJson(prompt)  [from ai/index.js]
  ↓
AI_PROVIDER = "gemini" → generateJsonGemini()
     or "groq" → generateJsonGroq()
  ↓
API Call (Gemini or Groq)
  ↓
Response (JSON)
```

### With Demo Mode
```
Request
  ↓
geminiService.generateRoadmapFromAI(topic)
  ↓
generateJson(prompt)  [from ai/index.js]
  ↓
generateJsonGemini() [or generateJsonGroq()]
  ↓
API Call fails (no key) ← catch error
  ↓
Return demo data (auto fallback)
  ↓
Response (same format as API)
```

## Key Points

1. **Endpoints Unchanged**: All URLs, methods, request/response formats are identical
2. **Demo Data Unchanged**: Same demo roadmaps, quizzes, articles
3. **Backward Compatible**: No breaking changes to your frontend or API contracts
4. **Transparent Provider Switching**: Frontend doesn't know which provider is used
5. **Graceful Fallback**: If API fails → automatic demo mode (no errors)

## Testing with cURL

```bash
# Test 1: Check server is running
curl http://localhost:5001/

# Test 2: Generate roadmap
curl -X POST http://localhost:5001/api/roadmaps/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"JavaScript"}'

# Test 3: Generate quiz
curl -X POST http://localhost:5001/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -d '{"moduleTitle":"Functions","topic":"JavaScript"}'

# Test 4: Switch to Groq and repeat
# (change .env: AI_PROVIDER=groq, restart, same curl commands)
```

## Environment Variable Precedence

```
1. Check AI_PROVIDER env variable (default: "gemini")
2. If "gemini":
   - Try GEMINI_API_KEYS (multiple)
   - Fallback to GEMINI_API_KEY (single)
   - If none → demo mode
3. If "groq":
   - Try GROQ_API_KEY
   - If none → demo mode
```

---

**Everything works exactly as before. Switch providers anytime. Your API is provider-agnostic now.** ✨
