# 🚨 API KEY CONFIGURATION REQUIRED

## Current Status
Both API keys in `.env` are **INVALID**:
- ❌ GEMINI_API_KEY: "API key not valid"
- ❌ YOUTUBE_API_KEY: "Method doesn't allow unregistered callers"

## Action Required: Get Valid API Keys

### 1. Gemini API Key (Required for Roadmap Generation)

Go to: https://aistudio.google.com/app/apikey

1. Click **"Create API Key"** button
2. Select a project or create new one
3. Copy the generated API key
4. Replace the value in `.env`:
   ```
   GEMINI_API_KEY=<your-new-key-here>
   ```

### 2. YouTube API Key (Required for Video Resources)

Go to: https://console.cloud.google.com/

1. Create a new project (or select existing)
2. Search for "YouTube Data API v3"
3. Click on it and press **"Enable"**
4. Go to **"Credentials"** in the left sidebar
5. Click **"+ Create Credentials"** → **"API Key"**
6. Copy the generated API key
7. **IMPORTANT**: Restrict the key to YouTube Data API only:
   - Click on the key
   - Under "API restrictions", select "YouTube Data API v3"
   - Click "Save"
8. Replace the value in `.env`:
   ```
   YOUTUBE_API_KEY=<your-new-key-here>
   ```

### 3. Update .env File

Edit `backend/.env` with your new keys:
```
PORT=5001
MONGO_URI=mongodb+srv://ateebarman:albert1209@cluster0.cvq0lbf.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_actual_gemini_key_here
YOUTUBE_API_KEY=your_actual_youtube_key_here
```

### 4. Restart Backend Server

After updating `.env`:
```bash
# Kill the current backend process
# Then restart:
npm run dev
```

### 5. Test the Services

After restarting, run tests:
```bash
node backend/test-gemini.js
node backend/test-youtube.js
```

You should see ✅ SUCCESS messages.

## Why This Happened

The API keys in the current `.env` are either:
1. Expired or revoked
2. Not properly activated in Google Cloud Console
3. Restricted to specific domains/IPs
4. From test/demo accounts

## Next Steps

Once you get valid API keys and restart the backend:
1. ✅ Backend will be able to generate roadmaps using Gemini AI
2. ✅ Backend will be able to fetch YouTube videos for modules
3. ✅ Frontend "Generate Roadmap" button will work
4. ✅ Roadmap view will display modules with video resources

**⏱️ Estimated time to fix: 5-10 minutes**
