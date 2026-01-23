# AI Tutor Chat Service - Setup Guide

## ✅ Implementation Complete

A new AI Tutor Chat service has been successfully integrated into your LearnSphere AI project using the Grok API.

---

## 📋 What Was Added

### Backend Files (4 new files)

1. **`backend/services/grokTutorService.js`**
   - Grok API integration with axios
   - System prompt for friendly coding tutor behavior
   - Message validation and history limiting (last 12 messages)
   - Comprehensive error handling

2. **`backend/controllers/tutorController.js`**
   - `handleTutorChat()` - Processes chat requests
   - Input validation for message and history
   - Response formatting

3. **`backend/routes/tutorRoutes.js`**
   - POST `/api/tutor` - Protected with JWT auth
   - Uses existing `authMiddleware` from the project

4. **`backend/test-tutor.js`**
   - Test script to verify Grok API integration
   - Sends sample messages and displays responses
   - Includes error handling

### Frontend Files (2 new files)

1. **`frontend/src/services/tutorService.js`**
   - `sendTutorMessage(message, history, token)` function
   - Integrated with existing axios API instance
   - Token passed in Authorization header

2. **`frontend/src/pages/TutorChat.jsx`**
   - Full-featured chat UI component
   - Message display (user on right, assistant on left)
   - Real-time auto-scroll
   - Loading indicators
   - Error handling with user-friendly messages
   - Clear chat button
   - Welcome screen when no messages
   - Tailwind CSS styling

### Modified Files (3 files)

1. **`backend/server.js`**
   - Added import: `import tutorRoutes from './routes/tutorRoutes.js';`
   - Registered route: `app.use('/api/tutor', tutorRoutes);`

2. **`frontend/src/App.jsx`**
   - Added import: `import TutorChat from './pages/TutorChat';`
   - Added route: `<Route path="tutor" element={<TutorChat />} />`

3. **`frontend/src/components/Navbar.jsx`**
   - Added navigation link: "🎓 AI Tutor" pointing to `/tutor`

---

## 🔑 Environment Variables Required

Add these to your `backend/.env` file:

```env
# Grok API Configuration
GROK_API_KEY=your_actual_grok_api_key_here
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-2-latest

# Existing variables (for reference)
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**⚠️ Important**: Never expose `GROK_API_KEY` to the frontend. It's kept secure on the backend.

---

## 🚀 How to Use

### 1. Set Up Environment Variables

```bash
cd backend
# Edit .env and add GROK_API_KEY
```

### 2. Start Backend

```bash
cd backend
npm start
# or with nodemon for development
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Test the Tutor Service

**Option A: Manual Test**
```bash
cd backend
node test-tutor.js
```

This will:
- Send 3 sample messages to the tutor
- Display formatted responses
- Show any errors with details

**Option B: Use the Frontend**
1. Navigate to http://localhost:5173 (or your frontend URL)
2. Log in with your account
3. Click "🎓 AI Tutor" in the navbar
4. Start chatting!

---

## 💬 Tutor Features

✅ **Free-form conversation** - Ask anything about coding, programming, algorithms, data structures, etc.

✅ **Step-by-step explanations** - AI provides detailed, beginner-friendly answers

✅ **Code examples** - Includes relevant code snippets when helpful

✅ **Clarifying questions** - If your question is vague, the tutor asks a follow-up

✅ **Markdown formatting** - Responses use proper formatting with code blocks

✅ **Chat history** - Context is maintained within the same session (limited to 12 messages for performance)

✅ **Error handling** - User-friendly error messages if something goes wrong

✅ **Session persistence** - Each user has their own conversation thread

---

## 🛡️ Security

- ✅ JWT authentication required for all tutor requests
- ✅ API key never exposed to frontend
- ✅ Input validation and sanitization
- ✅ Rate limiting recommended (implement in production)
- ✅ History limited to prevent token overflow

---

## 📝 API Response Format

### Request
```json
POST /api/tutor
Authorization: Bearer <JWT_TOKEN>

{
  "message": "Explain React useEffect with example",
  "history": [
    { "role": "user", "content": "What is React?" },
    { "role": "assistant", "content": "React is..." }
  ]
}
```

### Success Response
```json
{
  "success": true,
  "reply": "useEffect is a React hook that allows you to perform side effects..."
}
```

### Error Response
```json
{
  "error": "Message is required"
}
```

---

## 🔍 Integration Notes

### Separate from Existing AI Service
- ✅ Does NOT modify `backend/services/geminiService.js`
- ✅ Does NOT modify existing roadmap/quiz generation
- ✅ Uses separate Grok API configuration
- ✅ Independent controller and routes

### Uses Existing Project Patterns
- ✅ Same JWT middleware (`authMiddleware`)
- ✅ Same axios instance pattern (frontend)
- ✅ Same error handling middleware
- ✅ Same styling (Tailwind CSS)
- ✅ Same state management (Zustand)

---

## 🐛 Troubleshooting

### "Not authorized, token failed"
- Check that you're logged in
- Verify JWT_SECRET matches between server and client

### "Cannot connect to Grok API"
- Verify GROK_API_KEY is set correctly
- Check internet connection
- Ensure GROK_BASE_URL is correct

### "Rate limit exceeded"
- Wait a moment and try again
- Consider implementing rate limiting in production

### Empty response from tutor
- Check Grok API status
- Verify API key is valid
- Check message is not empty

### Frontend doesn't show tutor page
- Clear browser cache
- Ensure you're logged in
- Check browser console for errors
- Verify route is added to App.jsx

---

## 📚 Project Structure

```
backend/
├── services/
│   ├── grokTutorService.js      [NEW]
│   ├── geminiService.js          (unchanged)
│   └── ...
├── controllers/
│   ├── tutorController.js        [NEW]
│   ├── authController.js         (unchanged)
│   └── ...
├── routes/
│   ├── tutorRoutes.js            [NEW]
│   ├── authRoutes.js             (unchanged)
│   └── ...
├── test-tutor.js                 [NEW]
└── server.js                     (MODIFIED - added tutor route)

frontend/
├── src/
│   ├── pages/
│   │   ├── TutorChat.jsx         [NEW]
│   │   ├── Dashboard.jsx         (unchanged)
│   │   └── ...
│   ├── services/
│   │   ├── tutorService.js       [NEW]
│   │   ├── api.js                (unchanged)
│   │   └── ...
│   ├── components/
│   │   ├── Navbar.jsx            (MODIFIED - added AI Tutor link)
│   │   └── ...
│   └── App.jsx                   (MODIFIED - added tutor route)
```

---

## ✨ Next Steps (Optional Enhancements)

1. **Rate Limiting** - Add rate limiting per user to prevent abuse
2. **Chat History Persistence** - Save conversations to database
3. **User Feedback** - Add thumbs up/down for responses
4. **Search** - Allow users to search past conversations
5. **Export** - Export chat history as PDF
6. **Streaming** - Use Grok's streaming API for real-time responses
7. **Analytics** - Track which topics users ask about most

---

## 📞 Support

If you encounter issues:

1. Check browser console for frontend errors
2. Check backend logs for server errors
3. Verify all environment variables are set
4. Run `node test-tutor.js` to debug Grok API connection
5. Ensure MongoDB is connected
6. Check network tab in browser dev tools

---

## ✅ Verification Checklist

- [ ] GROK_API_KEY added to backend/.env
- [ ] Backend test script runs successfully (`node test-tutor.js`)
- [ ] Both frontend and backend servers are running
- [ ] User is logged in before accessing tutor
- [ ] "🎓 AI Tutor" link appears in navbar
- [ ] Clicking link navigates to /tutor
- [ ] Can send and receive messages
- [ ] Chat history is displayed correctly
- [ ] Error messages appear when needed
- [ ] No console errors in browser or terminal

---

**Implementation Date**: January 24, 2026
**Service**: Grok AI Tutor Chat
**Status**: ✅ Ready to Use
