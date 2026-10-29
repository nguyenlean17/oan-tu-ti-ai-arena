import assert from 'node:assert/strict';
import { isExtendedVnuEmail, extractStudentIdFromEmail, validateVnuRegistrationEmail } from '../lib/vnu-email-policy.mjs';

// Test 1: Hợp lệ với các email root và subdomain
const validEmails = [
  'student@vnu.edu.vn',
  'student.name@uet.vnu.edu.vn',
  '24020001@student.uet.vnu.edu.vn',
  'test@student.vnu.edu.vn',
  'faculty@hus.vnu.edu.vn',
  'dean@ussh.vnu.edu.vn'
];

for (const email of validEmails) {
  assert.ok(isExtendedVnuEmail(email), `Email hợp lệ bị từ chối: ${email}`);
  assert.doesNotThrow(() => validateVnuRegistrationEmail(email));
}

// Test 2: Chặn tuyệt đối các domain giả mạo hoặc bypass
const invalidEmails = [
  'attacker@gmail.com',
  'attacker@vnu.edu.vn.attacker.com',
  'attacker@evil-vnu.edu.vn',
  'attacker@fakevnu.edu.vn',
  'attacker@vnu.edu.vn@evil.test',
  '.student@vnu.edu.vn',
  'student..name@vnu.edu.vn',
  'student.@vnu.edu.vn',
  '@vnu.edu.vn',
  'attacker@other.edu.vn'
];

for (const email of invalidEmails) {
  assert.equal(isExtendedVnuEmail(email), false, `Email độc hại bị lọt qua: ${email}`);
  assert.throws(() => validateVnuRegistrationEmail(email), { status: 400 });
}

// Test 3: Trích xuất MSSV từ email
assert.equal(extractStudentIdFromEmail('24020001@vnu.edu.vn'), '24020001');
assert.equal(extractStudentIdFromEmail('24029999@uet.vnu.edu.vn'), '24029999');
assert.equal(extractStudentIdFromEmail('teacher.name@vnu.edu.vn'), null);

console.log('Extended VNU email policy tests passed: root domain, member subdomains, attack rejection, and student ID extraction.');
