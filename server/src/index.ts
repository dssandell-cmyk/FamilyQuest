import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import familyRoutes from './routes/families.js';
import taskRoutes from './routes/tasks.js';
import proposalRoutes from './routes/proposals.js';
import sideQuestRoutes from './routes/sideQuests.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/side-quests', sideQuestRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`FamilyQuest server running on port ${PORT}`);
});
