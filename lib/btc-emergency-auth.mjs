/**
 * BTC Emergency Authentication Fallback Module
 * Allows tournament administrators to generate one-time recovery and verification links
 * when external email providers (Resend, Mailpit) suffer downtime or hit rate limits.
 */

import { randomBytes, createHash } from 'node:crypto';

export const digest = val => createHash('sha256').update(val).digest('hex');

export function createEmergencyToken(userId, kind = 'reset', ttlMinutes = 60) {
  if (!userId) throw new Error('Cần userId.');
  if (kind !== 'reset' && kind !== 'verify') throw new Error('Loại token không hợp lệ.');

  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expires = now + ttlMinutes * 60000;

  return {
    rawToken: token,
    hash: digest(token),
    userId,
    kind,
    expires,
    created: now
  };
}

export function buildEmergencyLink(rawToken, kind = 'reset', publicOrigin = 'http://localhost:3000') {
  const path = kind === 'reset' ? '/reset-password' : '/verify-email';
  const url = new URL(path, publicOrigin);
  url.searchParams.set('token', rawToken);
  return url.toString();
}

export function formatAuditEntry(adminId, targetEmail, kind, reason = 'Sự cố gửi thư') {
  return {
    actor: adminId,
    action: `emergency_${kind}_issued`,
    target: targetEmail,
    reason,
    timestamp: new Date().toISOString()
  };
}
