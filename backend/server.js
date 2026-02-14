import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env FIRST before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!process.env.VERCEL) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

// Now import everything else
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initializeAI } from './services/ai/index.js';

import authRoutes from './routes/authRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import studyMaterialRoutes from './routes/studyMaterialRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';

initializeAI();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/knowledge', knowledgeRoutes);


// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;