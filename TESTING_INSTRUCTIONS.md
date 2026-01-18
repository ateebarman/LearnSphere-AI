# 🚀 LearnSphere AI - Frontend Testing Ready!

## ✅ SETUP COMPLETE

Both frontend and backend are running and ready for testing:

```
Frontend:  http://localhost:5174  ✅ Running
Backend:   http://localhost:5001  ✅ Running
Database:  MongoDB               ✅ Connected
```

---

## 🧪 START TESTING HERE

### Open these in your browser:

1. **Frontend**: http://localhost:5174
2. **DevTools**: F12 (to watch network requests)
3. **This Guide**: Keep it handy for reference

---

## 📝 TEST PLAN

### Phase 1: Authentication (15 minutes)

```
[ ] 1. Home Page Loads
     - Open http://localhost:5174
     - Verify: Colorful home page with features
     - Check: No console errors

[ ] 2. Signup New User
     - Click "Get Started Free"
     - Enter: Name, unique email, password
     - Click: "Create Account"
     - Verify: Redirected to /dashboard
     - Check: Welcome message shows your name

[ ] 3. Login Existing User
     - Logout first (if still logged in)
     - Click "Sign In"
     - Enter: Same email & password
     - Click: "Sign In"
     - Verify: Back to dashboard

[ ] 4. Protected Routes
     - Logout
     - Try accessing http://localhost:5174/dashboard
     - Verify: Redirected to login page
     - Try accessing http://localhost:5174/profile
     - Verify: Redirected to login page
```

**Network Tab Expectations:**
- POST /api/auth/signup → 201
- POST /api/auth/login → 200
- GET /api/auth/profile → 200

---

### Phase 2: Roadmap Features (20 minutes)

```
[ ] 5. Generate Roadmap
     - Login to dashboard
     - Type: "React Hooks"
     - Click: "Generate"
     - Wait: 30-60 seconds (AI is generating)
     - Verify: New roadmap card appears
     - Check: Shows title, description, progress bar

[ ] 6. View Roadmap Details
     - Click on the roadmap card
     - Verify: Shows modules with titles
     - Verify: Each module shows resources (videos, articles)
     - Verify: Progress bar visible

[ ] 7. Multiple Roadmaps
     - Generate another roadmap: "Python Basics"
     - Verify: Both cards visible on dashboard
     - Verify: Can click on either one
```

**Network Tab Expectations:**
- POST /api/roadmaps → 201 (with modules and resources)
- GET /api/roadmaps → 200 (returns array of roadmaps)

---

### Phase 3: Navigation & UI (10 minutes)

```
[ ] 8. Navbar Works
     - Click "Dashboard" link → loads dashboard
     - Click your name (profile icon) → loads profile
     - Click "Logout" → redirects to home

[ ] 9. Responsive Design
     - Resize browser window to mobile size (375px)
     - Verify: Elements reposition properly
     - Verify: Text is readable

[ ] 10. Error Messages
      - Try signup with invalid email: "test"
      - Verify: Shows validation error
      - Try signup with short password: "123"
      - Verify: Shows password requirement error
```

---

## 📊 What to Look For

### Browser DevTools - Console Tab
✅ Should see: No red error messages
❌ Should NOT see:
- CORS errors
- Fetch failed
- Undefined errors
- Network connection failed

### Browser DevTools - Network Tab
✅ Check each request:
- Status code should be 2xx (200, 201)
- Response should have data
- Should see Authorization header in requests

### Browser DevTools - Application Tab
✅ Local Storage should contain:
```json
{
  "auth-storage": {
    "state": {
      "userInfo": {
        "_id": "...",
        "name": "...",
        "email": "..."
      },
      "token": "eyJ..."
    }
  }
}
```

---

## 🔴 COMMON ISSUES & FIXES

### ❌ "Network Error" when signing up

**Cause:** Backend not running or CORS issue

**Solution:**
```bash
# In new terminal, check backend
cd backend
npm run dev
# Should show: Server running on port 5001
```

### ❌ "Invalid email" error

**Cause:** Email format validation failing

**Solution:** Use proper email format
```
✅ test@example.com
❌ test (no @)
❌ test@ (no domain)
```

### ❌ Signup works but page doesn't redirect

**Cause:** Token not saving properly

**Solution:** 
1. Check DevTools Console for errors
2. Check Application → Local Storage for auth-storage
3. Check Network tab - did signup request return token?

### ❌ Roadmap generation hangs forever

**Cause:** Gemini API not responding

**Solution:**
1. Check backend/.env has GEMINI_API_KEY
2. Check internet connection
3. Check backend console for errors
4. Try generating same topic again

### ❌ Page is blank / won't load

**Cause:** Frontend didn't compile

**Solution:**
```bash
# Check frontend is still running
# Terminal should show: ➜ Local: http://localhost:5174/

# If not, restart:
cd frontend
npm run dev
```

---

## ✨ EXPECTED RESULTS

### After Signup:
- ✅ Token saved in localStorage
- ✅ Redirected to /dashboard
- ✅ Shows personalized welcome message
- ✅ Empty roadmaps list

### After Generating Roadmap:
- ✅ Roadmap card appears on dashboard
- ✅ Shows title from AI
- ✅ Shows description
- ✅ Shows 0% progress (no quiz completed yet)
- ✅ Can click to view details

### After Viewing Roadmap:
- ✅ Shows list of modules
- ✅ Shows resources for each module
- ✅ Shows module descriptions
- ✅ Can read about learning path

---

## 📞 DEBUGGING COMMANDS

**In Browser Console (F12):**

```javascript
// Check if logged in
JSON.parse(localStorage.getItem('auth-storage'))

// Check token exists
localStorage.getItem('auth-storage')?.includes('token')

// Test API directly
fetch('http://localhost:5001/api/auth/profile', {
  headers: {
    'Authorization': `Bearer YOUR_TOKEN_HERE`
  }
}).then(r => r.json()).then(console.log)

// Clear localStorage (if needed)
localStorage.clear()
```

---

## 📋 TEST COMPLETION CHECKLIST

```
Authentication:
[ ] Home page loads
[ ] Can signup with new account  
[ ] Can login with existing account
[ ] Logout works
[ ] Protected routes redirect to login

Dashboard:
[ ] Welcome message displays correctly
[ ] Roadmap input field works
[ ] Can generate roadmap

Roadmap Features:
[ ] Roadmap card shows all info
[ ] Can click to view roadmap
[ ] Modules display with resources

Navigation:
[ ] Navbar links work
[ ] Can navigate between pages
[ ] Mobile responsive

Error Handling:
[ ] Invalid email shows error
[ ] Weak password shows error
[ ] Network errors handled gracefully
```

---

## 🎯 SUCCESS CRITERIA

Your frontend-backend connection is working when:

1. ✅ Can create account and get redirected
2. ✅ Can login and see dashboard
3. ✅ Token is saved in localStorage
4. ✅ Network requests show correct status codes
5. ✅ Can generate AI roadmap
6. ✅ No red errors in console

---

## 📚 DOCUMENTATION FILES

Created for reference:
- `STATUS.txt` - Quick status dashboard
- `QUICK_TEST.md` - Detailed test steps
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `backend/FIXES_APPLIED.md` - What was fixed
- `backend/TEST_GUIDE.md` - API endpoints reference

---

## 🚀 READY TO TEST!

**Your next step:**
1. Open http://localhost:5174 in browser
2. Try signing up with a new email
3. Report what you see and any errors
4. We'll fix issues together!

**Need help?** Check one of the documentation files above or describe the error you're seeing.

Happy testing! 🎉
