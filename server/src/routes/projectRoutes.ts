import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createShareToken
} from '../controllers/projectController.js';
import { authenticateToken } from '../middlewares/auth.js';

export const projectRoutes = Router();

projectRoutes.use(authenticateToken);

projectRoutes.post('/', createProject);
projectRoutes.get('/', listProjects);
projectRoutes.get('/:id', getProject);
projectRoutes.patch('/:id', updateProject);
projectRoutes.delete('/:id', deleteProject);
projectRoutes.post('/:id/share', createShareToken);
