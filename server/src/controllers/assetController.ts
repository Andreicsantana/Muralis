import { Response } from 'express';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, bucketName } from '../config/storage.js';
import { Asset, AssetType } from '../models/Asset.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function uploadAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    const type = (req.body.type || 'photo') as AssetType;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const storageKey = `${req.userId}/${type}_${uuidv4()}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    const asset = await Asset.create({
      ownerId: req.userId!,
      type,
      storageKey,
      mimeType: file.mimetype
    });

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 * 24 });

    res.status(201).json({
      asset,
      url: signedUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload asset' });
  }
}

export async function getAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: asset.storageKey
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 * 24 });

    res.json({
      asset,
      url: signedUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve asset' });
  }
}

export async function streamAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: asset.storageKey
    });

    const s3Response = await s3Client.send(getCommand);
    res.setHeader('Content-Type', asset.mimeType);
    if (s3Response.ContentLength) {
      res.setHeader('Content-Length', s3Response.ContentLength);
    }

    (s3Response.Body as any).pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stream asset' });
  }
}
