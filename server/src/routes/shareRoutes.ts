import { Router } from 'express';
import { getSharedProject } from '../controllers/shareController.js';

export const shareRoutes = Router();

shareRoutes.get('/:token', getSharedProject);
