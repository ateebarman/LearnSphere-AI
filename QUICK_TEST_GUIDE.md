# 🧪 Quick Test Guide

## Status: ✅ WORKING

Both frontend and backend are running. Demo mode is active.

## Test Steps

### 1. Check Both Servers Are Running
```
Frontend: http://localhost:5175
Backend: http://localhost:5001 (Running on port 5001)
```

### 2. Test User Authentication
**Signup:**
```
1. Go to http://localhost:5175
2. Click "Sign Up"
3. Enter:
   - Name: Your Name
   - Email: your.email@example.com
   - Password: TestPassword123
4. Click "Sign Up"
5. Should redirect to Login
```

**Login:**
```
1. Go to Login page
2. Enter same email and password
3. Click "Log In"
4. Should redirect to Dashboard
```

### 3. Test Roadmap Generation
```
1. On Dashboard, you'll see "Create a New Learning Roadmap"
2. Enter topic: "React Hooks"
3. Click "Generate" button
4. Wait 2-3 seconds
5. Should auto-redirect to roadmap view with:
   - Roadmap title
   - 3 modules with descriptions
   - Resources for each module
```

### 4. Test Roadmap Viewing
```
On the roadmap page, you should see:
✅ Roadmap title: "Learning React Hooks"
✅ Roadmap description
✅ Progress bar (should be 0%)
✅ 3 modules listed:
   - Introduction to React
   - State and Props
   - React Hooks
✅ Each module shows:
   - Title
   - Completion status (unchecked)
   - Estimated time
```

### 5. Test Module Resources
```
1. Click on first module "Introduction to React"
2. Module expands to show:
   ✅ Module description
   ✅ Resources section with:
      - Official React Documentation (link)
      - React Basics Article (link)
   ✅ Start Quiz button (blue)
```

### 6. Test Quiz Generation
```
1. Click "Start Quiz" on a module
2. Should navigate to quiz page with:
   ✅ 10 multiple choice questions
   ✅ Each question has 4 options
   ✅ You can select answers
3. Answer 5-10 questions
4. Click "Submit Quiz"
```

### 7. Test Quiz Scoring
```
After submitting quiz:
✅ Should see score (e.g., "You scored 60%")
✅ Should see feedback message
✅ Should see recommendations
✅ Module should mark as "Retake Quiz" (completed)
✅ Progress bar should update
```

### 8. Test Additional Topics
```
Go back to Dashboard and try other topics:
- "JavaScript Basics" → JavaScript roadmap
- "Machine Learning" → Generic roadmap
- "Web Design" → Generic roadmap
- "Python Fundamentals" → Generic roadmap
```

## What to Expect in Demo Mode

### ✅ Working Features
- Sign up and login with real database storage
- Generate roadmaps (demo data)
- View roadmap details
- See modules with resources
- Click resource links (work)
- Take quizzes (demo questions)
- Submit quizzes and see scores
- Track module completion
- See progress percentage
- Navigate between pages
- Beautiful Tailwind CSS UI

### ⚠️ Demo Data
- Roadmaps are pre-built samples for React/JavaScript
- Quiz questions are generic learning questions
- Video links point to demo playlists (not AI-generated)
- All data works but is templated

### 🔄 Will Improve with Real API Keys
- Get personalized roadmaps from Gemini AI
- Get AI-generated quiz questions
- Get real YouTube search results
- Get intelligent recommendations
- Support any topic (not just React/JS)

## Browser DevTools Check

### To verify requests are working:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Try generating a roadmap**
4. **Look for POST request to `/api/roadmaps`**
5. **Check Response tab shows:**
   ```json
   {
     "_id": "...",
     "title": "Learning ...",
     "modules": [
       {
         "title": "...",
         "resources": [...]
       }
     ]
   }
   ```
6. **Status should be 201 Created**

## Common Issues & Fixes

### Issue: Can't sign up
```
Check: 
- Is MongoDB connected? (Check backend terminal)
- Is password at least 6 characters?
- Is email valid format?
```

### Issue: Can't login
```
Check:
- Did you sign up first?
- Is email/password correct?
- Are both servers running?
```

### Issue: Roadmap doesn't generate
```
Check:
- Is topic entered (not empty)?
- Is backend running? (Check terminal)
- Is MongoDB connected?
- Check Network tab for error response
```

### Issue: Quiz doesn't appear
```
Check:
- Did you click "Start Quiz" button?
- Is module expanded?
- Check browser console (F12) for errors
```

## Success Indicators

When everything works, you should see:
```
✅ Frontend loads at http://localhost:5175
✅ Can sign up with new account
✅ Can login with account
✅ Dashboard shows empty roadmap list
✅ Can generate roadmap
✅ Redirects to roadmap view after generation
✅ Modules display with resources
✅ Can expand modules
✅ Resources have working links
✅ Can click "Start Quiz"
✅ Can answer quiz questions
✅ Can submit quiz
✅ See score and feedback
✅ Module marked as completed
✅ Progress bar updates
```

## Next Steps

1. **Test the flow above** (should take 5-10 minutes)
2. **Report any issues** you find
3. **Optionally get real API keys** to enable full AI features
4. **Deploy to cloud** (Azure, Vercel, etc.)

---

**Estimated test time: 10-15 minutes**
**All features should work in this test**
