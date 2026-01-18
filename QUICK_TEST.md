# 🚀 Frontend-Backend Connection Test

## Current Status
✅ Backend: http://localhost:5001 (Running)
✅ Frontend: http://localhost:5174 (Running)
✅ Database: MongoDB Connected

---

## Quick Start Testing

### Test 1: Health Check (No Login Required)
```bash
# In browser console:
fetch('http://localhost:5001/')
  .then(r => r.text())
  .then(console.log)

# Should output: "API is running..."
```

### Test 2: Signup Flow
**Steps:**
1. Go to http://localhost:5174/
2. Click "Get Started Free"
3. Fill form:
   - Name: Test User
   - Email: unique@email.com
   - Password: password123
   - Confirm: password123
4. Click "Create Account"

**Expected:**
- ✅ Redirects to /dashboard
- ✅ Shows "Welcome back, Test User!"
- ✅ Input field for creating roadmaps

**Check Console for:**
- No red errors
- Network tab shows POST to /api/auth/signup
- Response includes token

---

## Test 3: Authentication Token
```javascript
// Check if token is saved
const token = localStorage.getItem('auth-storage');
console.log(JSON.parse(token));

// Should show: { state: { userInfo: {...}, token: "..." }, version: 0 }
```

---

## Test 4: Dashboard Features
1. ✅ Can see "Welcome back" message
2. ✅ Can see input field for topic
3. ✅ Can see empty roadmaps section
4. ✅ Can click on navbar links (Dashboard, Profile, Logout)

---

## Test 5: Roadmap Generation (API Call Test)
**Steps:**
1. Type "React Hooks" in the topic input
2. Click "Generate" button
3. Watch for spinner

**Expected:**
- ✅ Spinner shows loading state
- ✅ After 30-60 seconds, new roadmap card appears
- ✅ Shows title, description, progress bar

**Check Console:**
- Network tab shows POST to /api/roadmaps
- Response includes modules array with resources

---

## Common Issues & Solutions

### Issue: "Network error" when trying to signup
**Solution:**
1. Check backend is running: `npm run dev` in backend folder
2. Check API URL in frontend/src/services/api.js is correct
3. Check CORS is enabled in backend/server.js

### Issue: Signup works but won't redirect
**Solution:**
1. Open DevTools Console
2. Check for JavaScript errors
3. Check localStorage for token: `localStorage.getItem('auth-storage')`

### Issue: Roadmap generation hangs
**Solution:**
1. Check Gemini API key in backend/.env
2. Check network tab - is request being sent?
3. Check backend console for errors

### Issue: CORS Error in browser
**Solution:**
Backend/server.js should have:
```javascript
app.use(cors());
```

---

## Network Tab Checklist

After signup, you should see requests:
- ✅ POST /api/auth/signup (Status: 201)
- ✅ GET /api/roadmaps (Status: 200)

Response should contain:
- ✅ _id
- ✅ token
- ✅ email
- ✅ name

---

## Database Check

If everything works:
- ✅ New user created in MongoDB
- ✅ User document has name, email, hashed password
- ✅ Token can be verified with JWT_SECRET

---

## 📊 Success Criteria

Frontend-Backend connection is working when:
1. ✅ Can visit http://localhost:5174 without errors
2. ✅ Can signup with new account
3. ✅ Token is saved in localStorage
4. ✅ Can access /dashboard (protected route)
5. ✅ Can generate roadmap (calls Gemini API)
6. ✅ Network tab shows correct API calls
7. ✅ Backend console shows request logs

---

## 🔍 Real-time Testing

**Keep these open:**
1. Browser (http://localhost:5174)
2. DevTools → Network & Console tabs
3. Backend terminal (to see logs)
4. This guide

**When testing:**
- Watch DevTools Network tab for API calls
- Watch backend terminal for request logs
- Check DevTools Console for errors
- Test one feature at a time

---

## Next Tests (After Auth Works)

1. Profile Page
2. Roadmap View Page
3. Quiz Generation
4. Quiz Submission
5. Analytics Dashboard

---

## 🆘 Need Help?

Check these files for more info:
- `TESTING_GUIDE.md` - Detailed testing procedures
- `backend/FIXES_APPLIED.md` - What was fixed
- `backend/TEST_GUIDE.md` - API endpoint reference
