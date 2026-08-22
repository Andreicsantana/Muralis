import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Project, Asset, Share } from '../models/index.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, basePhotoId, artAssetId, maskAssetId, cornerPoints, blendMode, opacity, brightness, contrast } = req.body;

    const project = await Project.create({
      userId: req.userId!,
      title: title || 'Untitled Project',
      basePhotoId: basePhotoId || null,
      artAssetId: artAssetId || null,
      maskAssetId: maskAssetId || null,
      cornerPoints: cornerPoints || [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 }
      ],
      blendMode: blendMode || 'multiply',
      opacity: opacity !== undefined ? opacity : 0.9,
      brightness: brightness !== undefined ? brightness : 1.0,
      contrast: contrast !== undefined ? contrast : 1.0,
      status: 'draft'
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
}

export async function listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const projects = await Project.findAll({
      where: { userId: req.userId },
      include: [
        { model: Asset, as: 'basePhoto', attributes: ['id', 'storageKey', 'mimeType'] },
        { model: Asset, as: 'artAsset', attributes: ['id', 'storageKey', 'mimeType'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list projects' });
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: { id, userId: req.userId },
      include: [
        { model: Asset, as: 'basePhoto' },
        { model: Asset, as: 'artAsset' },
        { model: Asset, as: 'maskAsset' },
        { model: Share, as: 'shares' }
      ]
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, basePhotoId, artAssetId, maskAssetId, cornerPoints, blendMode, opacity, brightness, contrast, status } = req.body;

    const project = await Project.findOne({ where: { id, userId: req.userId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (title !== undefined) project.title = title;
    if (basePhotoId !== undefined) project.basePhotoId = basePhotoId;
    if (artAssetId !== undefined) project.artAssetId = artAssetId;
    if (maskAssetId !== undefined) project.maskAssetId = maskAssetId;
    if (cornerPoints !== undefined) project.cornerPoints = cornerPoints;
    if (blendMode !== undefined) project.blendMode = blendMode;
    if (opacity !== undefined) project.opacity = opacity;
    if (brightness !== undefined) project.brightness = brightness;
    if (contrast !== undefined) project.contrast = contrast;
    if (status !== undefined) project.status = status;

    await project.save();

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ where: { id, userId: req.userId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
}

export async function createShareToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { expiresInDays } = req.body;

    const project = await Project.findOne({ where: { id, userId: req.userId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const token = uuidv4().replace(/-/g, '');
    let expiresAt: Date | null = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    const share = await Share.create({
      projectId: project.id,
      token,
      expiresAt
    });

    res.status(201).json(share);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create share link' });
  }
}
