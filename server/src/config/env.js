import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Repository root of the `server` package (…/server). */
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env') });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback = []) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .concat(fallback)
    .filter((entry, index, all) => all.indexOf(entry) === index);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const rawSecret = process.env.JWT_SECRET;
const DEV_FALLBACK_SECRET = 'civicfix-development-only-insecure-jwt-secret';

if (isProduction && (!rawSecret || rawSecret.length < 32)) {
  throw new Error(
    'JWT_SECRET must be set to a value of at least 32 characters when NODE_ENV=production.',
  );
}

if (!isProduction && !isTest && !rawSecret) {
  // eslint-disable-next-line no-console
  console.warn(
    '[civicfix] JWT_SECRET is not set — falling back to an insecure development secret. ' +
      'Copy server/.env.example to server/.env before deploying anywhere real.',
  );
}

export const env = {
  nodeEnv,
  isProduction,
  isTest,
  port: toInt(process.env.PORT, 5000),
  clientOrigins: toList(process.env.CLIENT_ORIGIN, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]),
  publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/$/, ''),
  mongoUri: process.env.MONGO_URI?.trim() || '',
  memoryDbPort: toInt(process.env.MEMORY_DB_PORT, 27777),
  jwtSecret: rawSecret || DEV_FALLBACK_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  storageDriver: (process.env.STORAGE_DRIVER || 'local').toLowerCase(),
  maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 5),
  rateLimitAuthMax: toInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
  rateLimitWriteMax: toInt(process.env.RATE_LIMIT_WRITE_MAX, 60),
  seedDefaultPassword: process.env.SEED_DEFAULT_PASSWORD || 'CivicFix@123',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'civicfix',
  },
};

export const isCloudinaryEnabled = () =>
  env.storageDriver === 'cloudinary' &&
  Boolean(
    env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
  );

export default env;
