import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/authRoutes.js';
import { assetRoutes } from './routes/assetRoutes.js';
import { projectRoutes } from './routes/projectRoutes.js';
import { shareRoutes } from './routes/shareRoutes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/assets', assetRoutes);
app.use('/projects', projectRoutes);
app.use('/share', shareRoutes);
