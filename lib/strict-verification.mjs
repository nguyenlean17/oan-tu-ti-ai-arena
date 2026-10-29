/**
 * Strict Email Verification Policy Module for UET Arena
 * Ensures accounts cannot access tournament features or impersonate mailboxes
 * without completing cryptographic email verification.
 */

export function isVerificationEnforced() {
  return process.env.REQUIRE_EMAIL_VERIFICATION === '1';
}

/**
 * Asserts that the authenticated user has verified their email address.
 * Throws an HTTP 403 error if verification is required but missing.
 */
export function assertAccountVerified(user, actionName = 'thao tác này') {
  if (!user) {
    throw Object.assign(new Error('Yêu cầu đăng nhập.'), { status: 401 });
  }

  // Admins always bypass student email verification
  if (user.is_admin) {
    return true;
  }

  if (isVerificationEnforced() && !user.verified) {
    throw Object.assign(
      new Error(`Bạn cần xác nhận email (${user.email}) trước khi thực hiện ${actionName}. Kiểm tra hộp thư của bạn.`),
      { status: 403, code: 'EMAIL_VERIFICATION_REQUIRED' }
    );
  }

  return true;
}

/**
 * Determines whether an immediate session token should be issued upon registration.
 * If verification is strictly required, returns false to prevent unverified mailbox hijacking.
 */
export function canIssueRegistrationSession(requireVerification = isVerificationEnforced()) {
  return !requireVerification;
}
