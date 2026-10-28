import crypto from 'node:crypto';

// Visually unambiguous alphabet (no O/0, I/1) — complaint IDs get read aloud
// and typed by hand during demos.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a human friendly, collision-resistant complaint reference such as
 * `CIV-261028-7KQ4`. Uniqueness is additionally guaranteed by a unique index
 * on `Issue.complaintId` plus a retry loop in the issue service.
 */
export function generateComplaintId(date = new Date()) {
  const stamp = [
    String(date.getFullYear()).slice(2),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `CIV-${stamp}-${suffix}`;
}

export default generateComplaintId;
