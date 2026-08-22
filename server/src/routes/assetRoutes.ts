import { Router } from 'express';
import { uploadAsset, getAsset, streamAsset } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

export const assetRoutes = Router();

assetRoutes.post('/upload', authenticateToken, upload.single('file'), uploadAsset);
assetRoutes.get('/:id', authenticateToken, getAsset);
assetRoutes.get('/:id/stream', authenticateToken, streamAsset);
