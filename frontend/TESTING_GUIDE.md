# 🧪 Frontend Testing Guide

## ✅ Frontend Status
- **Frontend URL**: http://localhost:5174/
- **Backend URL**: http://localhost:5001/
- **API Base**: http://localhost:5001/api

---

## 🔗 Testing Frontend-Backend Connection

### Step 1: Check Health
1. Open browser console (F12 or Ctrl+Shift+I)
2. Go to http://localhost:5174/
3. You should see the **Home page** with:
   - ✅ "Welcome to LearnSphere AI"
   - ✅ "Get Started Free" and "Sign In" buttons
   - ✅ Three feature cards

### Step 2: Test Signup
1. Click **"Get Started Free"** button
2. Fill in the form:
   - Name: `Test User`
   - Email: `test${Date.now()}@example.com` (unique email)
   - Password: `password123`
   - Confirm: `password123`
3. Click **"Create Account"**

**Expected Results:**
- ✅ No error in console
- ✅ Redirects to `/dashboard`
- ✅ Shows "Welcome back, Test User!"

**Possible Errors:**
- ❌ "Network Error" → Backend not running
- ❌ "CORS Error" → Backend CORS not configured
- ❌ "Invalid email" → Email validation failed

### Step 3: Test Dashboard
Once logged in, you should see:
- ✅ Welcome message with your name
- ✅ "Create a New Learning Roadmap" input box
- ✅ "Your Roadmaps" section (empty initially)

### Step 4: Test Roadmap Generation
1. Type a topic: `React Hooks`
2. Click **"Generate"** button
3. Watch for loading spinner

**Expected Results:**
- ✅ Spinner appears while generating
- ✅ After ~30 seconds, new roadmap appears
- ✅ Card shows title, description, and progress bar

**Possible Errors:**
- ❌ Spinner spins forever → Gemini API not working
- ❌ "Failed to generate roadmap" → Backend error
- ❌ Empty card data → AI response parsing issue

### Step 5: Test Navigation
1. Click on a roadmap card
2. Should navigate to `/roadmap/{id}`
3. You should see:
   - ✅ Roadmap title
   - ✅ Modules list with resources
   - ✅ Progress bar

---

## 🛠️ Troubleshooting

### Issue 1: "Network Error" or CORS Error

**Cause**: Backend not running or CORS not configured

**Fix**:
```bash
# Check backend is running
cd backend
npm run dev

# Check CORS in server.js includes localhost:5174
```

### Issue 2: "Invalid email" Error

**Cause**: Email validation is too strict or format issue

**Fix**: Use a valid email format: `user@example.com`

### Issue 3: Signup works but won't redirect

**Cause**: Token not being stored correctly

**Fix**: Check browser console for token value:
```javascript
// In console, check if token exists:
localStorage.getItem('token')
```

### Issue 4: Roadmap generation times out

**Cause**: Gemini API not responding

**Possible Fixes**:
1. Check API key in `.env` is correct
2. Check internet connection
3. Check Gemini API quota not exceeded

### Issue 5: Page shows "Loading..." forever

**Cause**: useAuthStore not initialized properly

**Fix**: Clear browser localStorage:
```javascript
// In console:
localStorage.clear()
// Then refresh page
```

---

## 📊 Testing Checklist

- [ ] **Health Check**: Home page loads without errors
- [ ] **Signup**: Can create new user account
- [ ] **Login**: Can log in with existing account
- [ ] **Dashboard**: Shows welcome message
- [ ] **Roadmap Generation**: AI generates roadmap for topic
- [ ] **Roadmap View**: Can view roadmap details
- [ ] **Profile**: Can view user profile
- [ ] **Logout**: Can log out successfully
- [ ] **Protected Routes**: Cannot access dashboard without login
- [ ] **Error Handling**: Shows proper error messages

---

## 🔍 Browser Console Debugging

### Check if API calls are happening:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try signup/generate roadmap
4. You should see requests to `http://localhost:5001/api/*`

### Check for errors:
1. Go to **Console** tab
2. Look for red error messages
3. Look for CORS or fetch errors

### Check localStorage:
1. Go to **Application** → **Storage** → **Local Storage**
2. Should have `token` and `userInfo` keys

---

## 🚀 Quick Test Commands

**In Browser Console:**

```javascript
// Check if API is reachable
fetch('http://localhost:5001/')
  .then(r => r.text())
  .then(t => console.log(t))

// Check if auth store is initialized
console.log(JSON.parse(localStorage.getItem('userInfo')))

// Test a protected endpoint
const token = localStorage.getItem('token');
fetch('http://localhost:5001/api/auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d))
```

---

## 📈 Next Steps If All Works

1. ✅ Test other features (quizzes, resources)
2. ✅ Test error handling (invalid credentials, etc.)
3. ✅ Test mobile responsiveness
4. ✅ Performance testing
5. ✅ Prepare for deployment

---

## 📝 Notes

- Backend must be running for frontend to work
- Token expires in 30 days (configured in JWT_SECRET)
- First roadmap generation may take longer (~30-60 seconds)
- YouTube API is called for resources, may take extra time
