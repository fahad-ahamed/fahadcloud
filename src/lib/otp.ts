// ============================================
// FahadCloud OTP Storage & Verification
// ============================================
// In-memory OTP store with expiry and rate limiting.
// Production-ready with auto-cleanup.
// ============================================

interface OtpEntry {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

// In-memory store (resets on server restart for security)
const otpStore = new Map<string, OtpEntry>();

// Rate limiting: max 3 OTP requests per email per 15 minutes
const otpRateLimit = new Map<string, { count: number; windowStart: number }>();
const MAX_OTP_REQUESTS = 3;
const OTP_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 3;

// ============ GENERATE OTP ============

export function generateOtp(): string {
  const digits = '0123456789';
  let otp = '';
  // Use crypto-quality randomness
  const array = new Uint32Array(OTP_LENGTH);
  // Fallback to Math.random if crypto not available
  try {
    const crypto = require('crypto');
    crypto.randomFillSync(array);
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[array[i] % digits.length];
    }
  } catch {
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
  }
  return otp;
}

// ============ STORE OTP ============

export function storeOtp(email: string, otp: string): { success: boolean; error?: string } {
  const key = email.toLowerCase().trim();
  const now = Date.now();

  // Check rate limit
  const rateEntry = otpRateLimit.get(key);
  if (rateEntry && (now - rateEntry.windowStart) < OTP_RATE_WINDOW) {
    if (rateEntry.count >= MAX_OTP_REQUESTS) {
      const resetIn = Math.ceil((OTP_RATE_WINDOW - (now - rateEntry.windowStart)) / 60000);
      return { success: false, error: `Too many OTP requests. Try again in ${resetIn} minutes.` };
    }
    rateEntry.count++;
  } else {
    otpRateLimit.set(key, { count: 1, windowStart: now });
  }

  // Invalidate any previous OTP for this email
  otpStore.delete(key);

  // Store new OTP
  otpStore.set(key, {
    email: key,
    otp,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY,
    attempts: 0,
    verified: false,
  });

  return { success: true };
}

// ============ VERIFY OTP ============

export function verifyOtp(email: string, otp: string): { success: boolean; error?: string } {
  const key = email.toLowerCase().trim();
  const entry = otpStore.get(key);

  if (!entry) {
    return { success: false, error: 'No verification code found. Please request a new one.' };
  }

  const now = Date.now();

  // Check expiry
  if (now > entry.expiresAt) {
    otpStore.delete(key);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Check max attempts
  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Increment attempts
  entry.attempts++;

  // Verify code
  if (entry.otp !== otp) {
    const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;
    return { success: false, error: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }

  // Success - mark as verified and clean up
  entry.verified = true;
  otpStore.delete(key);

  return { success: true };
}

// ============ CLEANUP (auto-run) ============

// Clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of otpStore.entries()) {
      if (now > entry.expiresAt + 60000) { // 1 min grace period after expiry
        otpStore.delete(key);
      }
    }
    // Clean rate limit entries older than 30 minutes
    for (const [key, entry] of otpRateLimit.entries()) {
      if (now - entry.windowStart > OTP_RATE_WINDOW * 2) {
        otpRateLimit.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
