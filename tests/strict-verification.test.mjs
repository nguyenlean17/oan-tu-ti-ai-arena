import assert from 'node:assert/strict';
import { assertAccountVerified, canIssueRegistrationSession } from '../lib/strict-verification.mjs';

// Setup environment
process.env.REQUIRE_EMAIL_VERIFICATION = '1';

// Test 1: Người dùng chưa xác thực email bị chặn
const unverifiedUser = { id: 'u1', email: 'student@vnu.edu.vn', verified: 0, is_admin: 0 };
assert.throws(
  () => assertAccountVerified(unverifiedUser, 'nhận đội'),
  err => err.status === 403 && err.code === 'EMAIL_VERIFICATION_REQUIRED'
);

// Test 2: Người dùng đã xác thực email được thông qua
const verifiedUser = { id: 'u2', email: 'verified@vnu.edu.vn', verified: Date.now(), is_admin: 0 };
assert.doesNotThrow(() => assertAccountVerified(verifiedUser, 'nhận đội'));

// Test 3: Admin luôn được thông qua dù verified = 0
const adminUser = { id: 'admin', email: 'btc@vnu.edu.vn', verified: 0, is_admin: 1 };
assert.doesNotThrow(() => assertAccountVerified(adminUser, 'thao tác'));

// Test 4: Can issue session on register
assert.equal(canIssueRegistrationSession(true), false, 'Không được cấp session ngay khi bắt buộc xác thực');
assert.equal(canIssueRegistrationSession(false), true, 'Được cấp session khi không bắt buộc xác thực');

console.log('Strict verification tests passed: unverified block, verified allow, admin bypass, and session issuance logic.');
