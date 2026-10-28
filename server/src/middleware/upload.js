import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

/**
 * Uploads are buffered in memory, validated, then handed to the storage
 * service (local disk or Cloudinary). Keeping the buffer avoids writing
 * rejected files to disk at all.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 5,
    fields: 20,
  },
  fileFilter: (_req, file, cb) => {
    const mimeOk = ALLOWED_MIME_TYPES.has((file.mimetype || '').toLowerCase());
    const extOk = ALLOWED_EXTENSIONS.test(file.originalname || '');
    if (!mimeOk || !extOk) {
      return cb(
        ApiError.badRequest(
          'Only JPG, PNG, WEBP, GIF or HEIC images can be uploaded.',
          { code: 'UNSUPPORTED_FILE_TYPE' },
        ),
      );
    }
    return cb(null, true);
  },
});

/** `uploadImages` accepts up to 5 files under the `photos` / `proof` fields. */
export const uploadImages = upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'proof', maxCount: 2 },
]);

export default uploadImages;
