# Roadmap Generation Testing Guide

## Issue: Roadmap generation not working

### Step 1: Check Backend Services
The backend should have:
- ✅ Express server running on port 5001
- ✅ MongoDB connected
- ✅ Gemini API key configured
- ✅ YouTube API key configured

### Step 2: Manual Test Flow

#### A. Test Gemini Service Directly
Create a test file at `backend/test-gemini.js`:

```javascript
import { generateRoadmapFromAI } from './services/geminiService.js';

const test = async () => {
  try {
    const roadmap = await generateRoadmapFromAI('React Hooks');
    console.log('SUCCESS: Gemini returned:', JSON.stringify(roadmap, null, 2));
  } catch (error) {
    console.error('ERROR: Gemini failed:', error.message);
  }
};

test();
```

Run with: `node backend/test-gemini.js`

#### B. Test YouTube Service Directly
Create a test file at `backend/test-youtube.js`:

```javascript
import { searchYouTube } from './services/youtubeService.js';

const test = async () => {
  try {
    const videos = await searchYouTube('React Hooks tutorial');
    console.log('SUCCESS: YouTube returned:', JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error('ERROR: YouTube failed:', error.message);
  }
};

test();
```

Run with: `node backend/test-youtube.js`

#### C. Test Full Roadmap Generation via API
1. Sign up/login on http://localhost:5175
2. Go to Dashboard
3. Try generating a roadmap for "React Basics"
4. **Check browser DevTools Console** (F12) for errors
5. **Check browser Network tab** to see:
   - POST /api/roadmaps request
   - Response status and body
   - Any network errors

#### D. Check Backend Logs
While making a request, watch the terminal where backend is running for:
- Success logs (if any)
- Error messages
- Stack traces

### Expected Data Structure

When roadmap is successfully created, it should return:

```json
{
  "_id": "...",
  "user": "...",
  "title": "Learning React Basics",
  "description": "A personalized roadmap...",
  "modules": [
    {
      "_id": "...",
      "title": "Introduction to React",
      "description": "...",
      "estimatedTime": "3 hours",
      "resources": [
        {
          "title": "Official React Docs",
          "type": "doc",
          "url": "https://...",
          "description": "..."
        },
        {
          "title": "React Intro Playlist",
          "type": "video",
          "url": "https://www.youtube.com/playlist?list=...",
          "description": "..."
        }
      ],
      "isCompleted": false
    }
  ],
  "progress": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Possible Issues to Check

1. **Gemini API Key Invalid**: Test with `test-gemini.js`
2. **YouTube API Key Invalid**: Test with `test-youtube.js`
3. **Gemini Response Format**: Check if Gemini is returning invalid JSON
4. **YouTube Response Format**: Check if videos are being fetched
5. **Authorization Token Missing**: Check browser Network tab headers
6. **MongoDB Connection**: Check backend logs for connection errors
7. **CORS Issues**: Check browser console for CORS errors

### Quick Diagnostic Commands

From backend folder:
```bash
# Test Gemini service
node -e "import('./services/geminiService.js').then(m => m.generateRoadmapFromAI('React')).catch(e => console.error(e))"

# Test YouTube service
node -e "import('./services/youtubeService.js').then(m => m.searchYouTube('React tutorial')).catch(e => console.error(e))"

# Check if MongoDB is responding
node -e "import('./config/db.js').then(m => console.log('Connected')).catch(e => console.error('Error:', e.message))"
```

### Browser Network Tab Debugging

When you click "Generate" button:
1. Look for POST request to `/api/roadmaps`
2. Check Request Headers for:
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
3. Check Response:
   - Status code (should be 201 for success, 400/500 for error)
   - Body should contain the roadmap object
4. If error, the response body should explain what went wrong

### Frontend Issues to Check

In RoadmapView.jsx:
- After successful generation, should navigate to `/roadmap/{id}`
- Component should fetch roadmap with `getRoadmapById(id)`
- Should display modules with `ModuleCard` component
- Each module should have: title, description, estimatedTime, resources array

### Resolution Steps

If "Generate" button doesn't work:
1. ✅ Verify both servers are running
2. ✅ Verify API keys in .env
3. ✅ Test services directly (test-gemini.js, test-youtube.js)
4. ✅ Check browser Network tab for API response
5. ✅ Check backend terminal for error messages
6. ✅ Check browser Console for JavaScript errors
7. ✅ Verify user is logged in (check useAuthStore)
8. ✅ Verify token is being sent (check Network tab Authorization header)
