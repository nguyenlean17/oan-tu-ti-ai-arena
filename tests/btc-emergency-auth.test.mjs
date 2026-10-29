import assert from 'node:assert/strict';
import { createEmergencyToken, buildEmergencyLink, formatAuditEntry, digest } from '../lib/btc-emergency-auth.mjs';

// Test 1: Tạo token khẩn cấp hợp lệ
const record = createEmergencyToken('user_123', 'reset', 30);
assert.equal(record.userId, 'user_123');
assert.equal(record.kind, 'reset');
assert.ok(/^[a-f0-9]{64}$/.test(record.rawToken));
assert.equal(record.hash, digest(record.rawToken));
assert.ok(record.expires > Date.now());

// Test 2: Build emergency link
const link = buildEmergencyLink(record.rawToken, 'reset', 'https://arena.uet.vnu.edu.vn');
assert.ok(link.startsWith('https://arena.uet.vnu.edu.vn/reset-password?token='));
assert.ok(link.includes(record.rawToken));

const verifyLink = buildEmergencyLink(record.rawToken, 'verify', 'https://arena.uet.vnu.edu.vn');
assert.ok(verifyLink.startsWith('https://arena.uet.vnu.edu.vn/verify-email?token='));

// Test 3: Audit log entry format
const audit = formatAuditEntry('admin_root', 'student@vnu.edu.vn', 'reset', 'Hết quota Resend');
assert.equal(audit.actor, 'admin_root');
assert.equal(audit.action, 'emergency_reset_issued');
assert.equal(audit.target, 'student@vnu.edu.vn');

console.log('BTC Emergency Auth tests passed: token generation, link building, and audit logging.');
