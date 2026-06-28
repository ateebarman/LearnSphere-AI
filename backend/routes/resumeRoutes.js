import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { aiService } from '../services/interviewService.js';
import User from '../models/userModel.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const userId = req.user._id || req.user.id;

    let pdfParse;
    try {
      pdfParse = (await import('pdf-parse-fork')).default;
    } catch (e) {
      pdfParse = (await import('pdf-parse')).default;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: 'Could not extract text. Ensure PDF is not image-only.' });
    }

    const resumeData = await aiService.generateStructuredResponse({
      messages: [{
        role: 'user',
        content: `Parse this resume and return structured JSON. Extract EVERYTHING.

Resume text:
${resumeText.slice(0, 4000)}

Return ONLY valid JSON:
{
  "name": "Full name",
  "email": "email if present",
  "summary": "professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [{"company": "...", "role": "...", "duration": "...", "description": "...", "technologies": []}],
  "projects": [{"name": "...", "description": "...", "technologies": [], "highlights": []}],
  "education": [{"institution": "...", "degree": "...", "field": "...", "year": "..."}],
  "achievements": ["achievement1"]
}`
      }],
      temperature: 0.1,
      maxTokens: 2000,
    });

    await User.findByIdAndUpdate(userId, {
      'profile.resumeText': resumeText,
      'profile.resumeData': resumeData,
      'profile.skills': resumeData.skills || [],
    });

    res.json({ success: true, resumeData, preview: resumeText.slice(0, 300) + '...' });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/resume/data
router.get('/data', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('profile');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, resumeData: user.profile?.resumeData || null, skills: user.profile?.skills || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
