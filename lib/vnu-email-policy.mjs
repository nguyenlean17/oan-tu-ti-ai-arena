/**
 * Extended VNU Email Policy for UET Arena
 * Supports both root `@vnu.edu.vn` and member university subdomains:
 * - @vnu.edu.vn
 * - @uet.vnu.edu.vn
 * - @student.uet.vnu.edu.vn
 * - @student.vnu.edu.vn
 * - @hus.vnu.edu.vn, @ussh.vnu.edu.vn, etc.
 *
 * Strict validation:
 * - Prevents lookalike attack domains (e.g. attacker-vnu.edu.vn, vnu.edu.vn.attacker.com)
 * - Prevents dot manipulation (.user@, user..name@)
 * - Normalizes case and trims whitespace
 */

export const normalizeEmail = value => String(value || '').trim().toLowerCase();

export const VNU_DOMAIN_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-z0-9-]+\.)*vnu\.edu\.vn$/;

export function isExtendedVnuEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;

  // Basic sanity check against malformed dots
  if (email.startsWith('.') || email.includes('..') || email.includes('.@') || email.includes('@.')) {
    return false;
  }

  // Domain structure check
  if (!VNU_DOMAIN_REGEX.test(email)) {
    return false;
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return false;

  // Domain must exactly be vnu.edu.vn or end with .vnu.edu.vn
  if (domain !== 'vnu.edu.vn' && !domain.endsWith('.vnu.edu.vn')) {
    return false;
  }

  return true;
}

export function extractStudentIdFromEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isExtendedVnuEmail(normalized)) return null;

  const localPart = normalized.split('@')[0];
  // Common VNU student pattern: 8 digits starting with 2-digit intake year (e.g., 24020001)
  const match = /^(\d{8})$/.exec(localPart);
  return match ? match[1] : null;
}

export function validateVnuRegistrationEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isExtendedVnuEmail(normalized)) {
    throw Object.assign(
      new Error('Sinh viên cần sử dụng email chính thức của ĐHQGHN (@vnu.edu.vn hoặc @*.vnu.edu.vn).'),
      { status: 400 }
    );
  }
  return normalized;
}
