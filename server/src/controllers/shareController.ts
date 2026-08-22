import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Share, Project, Asset } from '../models/index.js';
import { s3Client, bucketName } from '../config/storage.js';

export async function getSharedProject(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    const share = await Share.findOne({
      where: {
        token,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            { model: Asset, as: 'basePhoto' },
            { model: Asset, as: 'artAsset' },
            { model: Asset, as: 'maskAsset' }
          ]
        }
      ]
    });

    if (!share || !share.project) {
      res.status(404).json({ error: 'Share link invalid or expired' });
      return;
    }

    const projectData = share.project.toJSON() as any;

    if (projectData.basePhoto) {
      const getBase = new GetObjectCommand({ Bucket: bucketName, Key: projectData.basePhoto.storageKey });
      projectData.basePhoto.url = await getSignedUrl(s3Client, getBase, { expiresIn: 3600 * 4 });
    }

    if (projectData.artAsset) {
      const getArt = new GetObjectCommand({ Bucket: bucketName, Key: projectData.artAsset.storageKey });
      projectData.artAsset.url = await getSignedUrl(s3Client, getArt, { expiresIn: 3600 * 4 });
    }

    if (projectData.maskAsset) {
      const getMask = new GetObjectCommand({ Bucket: bucketName, Key: projectData.maskAsset.storageKey });
      projectData.maskAsset.url = await getSignedUrl(s3Client, getMask, { expiresIn: 3600 * 4 });
    }

    res.json({
      share: {
        token: share.token,
        expiresAt: share.expiresAt
      },
      project: projectData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get shared project' });
  }
}
