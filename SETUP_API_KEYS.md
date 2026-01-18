# Complete API Key Setup Guide

## Problem Summary
The roadmap generation, viewing, and module resource display features are not working because:
1. **Gemini API Key is invalid** - Cannot generate roadmaps with AI
2. **YouTube API Key is not properly configured** - Cannot fetch video resources

## Solution: Get and Configure Valid API Keys

### Part 1: Get Gemini API Key (2 minutes)

**Step 1:** Visit https://aistudio.google.com/app/apikey
- Click the blue **"Create API Key"** button
- Choose project (or create new one named "LearnSphere-AI")
- Wait a few seconds for key to generate
- Click **"Copy"** button

**Step 2:** Update your `.env` file
```
# Replace this:
GEMINI_API_KEY=AIzaSyBNJZnk88bGS_O5QuQLJN6hZtFAUyH0uOQ

# With your new key:
GEMINI_API_KEY=<paste-your-key-here>
```

### Part 2: Get YouTube API Key (5-7 minutes)

**Step 1:** Visit https://console.cloud.google.com/

**Step 2:** Create or Select Project
- Click the project dropdown at the top
- Click **"New Project"**
- Name: "LearnSphere-AI"
- Click **"Create"**
- Wait for project to be created
- Select it from the dropdown

**Step 3:** Enable YouTube Data API v3
- In the search bar, type "YouTube Data API v3"
- Click on it in the results
- Click the **"Enable"** button
- Wait for it to enable

**Step 4:** Create API Key
- In the left sidebar, click **"Credentials"**
- Click **"+ Create Credentials"** button
- Select **"API Key"**
- Copy your API key
- Click outside the popup to close it

**Step 5:** Restrict the Key (Important!)
- Click on your newly created key in the API Keys section
- Under "API restrictions" section:
  - Select **"Restrict key"**
  - Choose **"YouTube Data API v3"** from the dropdown
  - Click **"Save"**

**Step 6:** Update `.env`
```
# Replace this:
YOUTUBE_API_KEY=AIzaSyAkiigmGtwDzBggJlOfHEqnrjd3_qWSFYI

# With your new key:
YOUTUBE_API_KEY=<paste-your-key-here>
```

### Part 3: Verify and Test

**Step 1:** Restart Backend
```bash
# If backend is running, stop it (Ctrl+C in the terminal)
# Then:
cd backend
npm run dev
```

**Step 2:** Run Verification Tests
```bash
# In a new terminal, from backend folder:
node test-gemini.js
node test-youtube.js
```

Expected output:
```
✅ SUCCESS: Gemini returned: { title: "...", description: "...", modules: [...] }
✅ SUCCESS: YouTube returned: [{ title: "...", url: "..." }]
```

**Step 3:** Test in Browser
1. Open http://localhost:5175 (your frontend)
2. Sign up or login
3. Go to Dashboard
4. Enter "React Basics" in the text field
5. Click "Generate" button
6. Should see loading spinner then redirect to roadmap view
7. Roadmap should display modules with resources

## Troubleshooting

### If you get "Invalid API key" error:
1. Double-check you copied the entire key
2. Make sure there are no extra spaces in `.env`
3. Save the `.env` file
4. Restart backend server
5. Try test again

### If YouTube returns 403 Forbidden:
1. Make sure you enabled "YouTube Data API v3" in Google Cloud Console
2. Make sure the key is restricted to YouTube Data API
3. Wait 1-2 minutes for Google to propagate the settings
4. Try again

### If tests still fail:
1. Check `.env` file has correct keys (no typos, no extra spaces)
2. Make sure you restarted backend after changing `.env`
3. Try running tests again

## After Setup Works

Once tests pass with ✅ SUCCESS:
- ✅ Roadmap generation with AI will work
- ✅ Modules will display with estimated time
- ✅ YouTube playlists will appear as resources
- ✅ RoadmapView component will display everything correctly
- ✅ Module completion tracking will work
- ✅ Quiz generation will work

## Summary of Changes Made

File: `backend/.env`
```diff
- GEMINI_API_KEY=AIzaSyBNJZnk88bGS_O5QuQLJN6hZtFAUyH0uOQ
+ GEMINI_API_KEY=<your-actual-key>

- YOUTUBE_API_KEY=AIzaSyAkiigmGtwDzBggJlOfHEqnrjd3_qWSFYI
+ YOUTUBE_API_KEY=<your-actual-key>
```

That's it! Two keys, two updates, then restart = fully working roadmap feature.
