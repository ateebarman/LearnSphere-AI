import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import FormData from 'form-data';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const GROQ_WHISPER_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';

// GET /api/transcribe/health — Check if transcription is available
router.get('/health', protect, (req, res) => {
  const hasKey = !!(process.env.GROQ_API_KEY1 || process.env.GROQ_API_KEY);
  res.json({ available: hasKey, model: 'whisper-large-v3-turbo' });
});

// POST /api/transcribe — Transcribe audio blob via Groq Whisper
// Accepts multipart/form-data with field 'audio'
router.post('/', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const apiKey = process.env.GROQ_API_KEY1 || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, error: 'Transcription service not configured' });
    }

    // Build multipart form for Groq
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: 'audio.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'en');
    form.append('temperature', '0');

    const response = await fetch(GROQ_WHISPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq Whisper error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.error?.message || 'Transcription failed',
      });
    }

    const transcript = (data.text || '').trim();
    res.json({ success: true, transcript });
  } catch (error) {
    console.error('Transcription endpoint error:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error during transcription' });
  }
});

export default router;

