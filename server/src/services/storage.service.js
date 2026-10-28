import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import env, { SERVER_ROOT } from '../config/env.js';
import { isCloudinaryEnabled } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');
export const UPLOADS_ROUTE = '/uploads';

const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const randomName = (file) => {
  const ext =
    EXTENSION_BY_MIME[file.mimetype] ||
    (path.extname(file.originalname || '').toLowerCase() || '.jpg');
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
};

async function saveToLocalDisk(file) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = randomName(file);
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
  return {
    url: `${UPLOADS_ROUTE}/${filename}`,
    publicId: filename,
  };
}

async function saveToCloudinary(file) {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.cloudinary.folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(
            ApiError.badRequest('Image upload failed. Please try again.', {
              code: 'UPLOAD_FAILED',
            }),
          );
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(file.buffer);
  });
}

/** Persists every uploaded file and returns `[{ url, publicId, uploadedAt }]`. */
export async function saveUploadedFiles(files = []) {
  if (!files.length) return [];
  const uploader = isCloudinaryEnabled() ? saveToCloudinary : saveToLocalDisk;
  const saved = await Promise.all(files.map((file) => uploader(file)));
  return saved.map((entry) => ({ ...entry, uploadedAt: new Date() }));
}

/** Best-effort cleanup used when photos are removed or an issue is deleted. */
export async function deleteStoredFile({ url, publicId }) {
  try {
    if (isCloudinaryEnabled()) {
      if (!publicId) return;
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: env.cloudinary.cloudName,
        api_key: env.cloudinary.apiKey,
        api_secret: env.cloudinary.apiSecret,
        secure: true,
      });
      await cloudinary.uploader.destroy(publicId);
      return;
    }

    const filename = publicId || path.basename(url || '');
    if (!filename) return;
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // Cleanup failures must never break the request that triggered them.
  }
}

export default { saveUploadedFiles, deleteStoredFile, UPLOADS_DIR, UPLOADS_ROUTE };
