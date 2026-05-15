
import { db } from '@/lib/db';
import { createToken, verifyToken, getCurrentUser } from '@/lib/auth';
import { userRepository } from '@/lib/repositories';
import { checkRateLimit } from '@/lib/rateLimit';
import { generateOtp, storeOtp, verifyOtp } from '@/lib/otp';
import { sendOtpEmail, sendRegistrationOtpEmail, sendActionVerificationEmail, sendPasswordResetEmail, loadOwnerConfig } from '@/lib/smtp';
import { appConfig } from '@/lib/config/app.config';
import bcrypt from 'bcryptjs';

export class AuthService {
  async login(emailOrUsername: string, password: string, ip: string) {
    const rateLimit = checkRateLimit(ip, 'login');
    if (!rateLimit.allowed) {
      return { error: 'Too many login attempts. Please try again later.', resetIn: rateLimit.resetIn, status: 429 };
    }

    if (!emailOrUsername || !password) {
      return { error: 'Email and password are required', status: 400 };
    }

    // Try email first, then username lookup with indexed query instead of loading all users
    let user = await userRepository.findByEmail(emailOrUsername);
    if (!user) {
      // Try username matching with targeted queries instead of loading all users
      const usernameLower = emailOrUsername.toLowerCase();
      // Try "firstname.lastname" pattern
      const parts = usernameLower.split('.');
      if (parts.length >= 2) {
        user = await db.user.findFirst({
          where: {
            firstName: { equals: parts[0], mode: 'insensitive' },
            lastName: { equals: parts.slice(1).join('.'), mode: 'insensitive' },
            role: { in: ['admin', 'customer'] },
          },
        });
      }
      // Try just firstname
      if (!user) {
        user = await db.user.findFirst({
          where: {
            firstName: { equals: usernameLower, mode: 'insensitive' },
            role: { in: ['admin', 'customer'] },
          },
        });
      }
    }
    if (!user) {
      return { error: 'Invalid email or password', status: 401 };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Check if user is blocked
    if (user.role === 'blocked') {
      return { error: 'Your account has been blocked. Please contact support for assistance.', status: 403 };
    }

    if (!user.emailVerified && user.role !== 'admin') {
      return { error: 'Please verify your email address before logging in. Check your inbox for the verification code.', requiresVerification: true, email: user.email, status: 403 };
    }

    await userRepository.updateLastLogin(user.id, ip);

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        role: user.role, adminRole: user.adminRole, emailVerified: user.emailVerified,
      },
    };
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; company?: string; phone?: string; address?: string; city?: string; country?: string }, ip: string) {
    const rateLimit = checkRateLimit(ip, 'register');
    if (!rateLimit.allowed) {
      return { error: 'Too many registration attempts. Please try again later.', resetIn: rateLimit.resetIn, status: 429 };
    }

    // Check if registration is enabled
    const regSetting = await db.agentSystemConfig.findUnique({ where: { key: 'registration_enabled' } });
    if (regSetting && regSetting.value === 'false') {
      return { error: 'New registrations are currently disabled. Please try again later.', status: 403 };
    }

    const { email, password, firstName, lastName } = data;
    if (!email || !password || !firstName || !lastName) {
      return { error: 'Email, password, first name, and last name are required', status: 400 };
    }
    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters', status: 400 };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Invalid email format', status: 400 };
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      if (!existingUser.emailVerified) {
        await userRepository.deleteWithCascade(existingUser.id);
      } else {
        return { error: 'An account with this email already exists', status: 409 };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(), password: hashedPassword, firstName, lastName,
        company: data.company || null, phone: data.phone || null,
        address: data.address || null, city: data.city || null, country: data.country || null,
        role: 'customer', balance: appConfig.admin.defaultBalance, storageLimit: appConfig.admin.defaultStorageLimit, storageUsed: 0, emailVerified: false,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      await db.emailVerification.create({
        data: { email: email.toLowerCase(), otp, type: 'registration', expiresAt: new Date(Date.now() + 10 * 60 * 1000), userId: user.id },
      });
    } catch (dbError: any) {
      console.error('[REGISTER] EmailVerification create error:', dbError.message);
    }

    let emailResult: { success: boolean; error?: string } = { success: false, error: 'Not attempted' };
    try {
      emailResult = await sendRegistrationOtpEmail(email, otp, firstName);
    } catch (smtpError: any) {
      console.error('[REGISTER] SMTP send error:', smtpError.message);
    }
    
    if (!emailResult.success) {
      if (process.env.NODE_ENV !== 'production') console.log('[SMTP FAILED] Registration OTP for ' + email + ': ' + otp);
    }

    return {
      message: emailResult.success 
        ? 'Registration initiated! Please check your email for verification code.'
        : 'Registration successful! Verification code is being processed. Please try verifying in a moment.',
      requiresVerification: true, email: email.toLowerCase(),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: false },
      status: 201,
    };
  }

  async verifyEmail(email: string, otp: string) {
    if (!email || !otp) return { error: 'Email and verification code are required', status: 400 };

    const verification = await db.emailVerification.findFirst({
      where: { email: email.toLowerCase(), type: 'registration', verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) return { error: 'Invalid or expired verification code. Please request a new one.', status: 400 };
    if (verification.otp !== otp) return { error: 'Incorrect verification code. Please try again.', status: 400 };

    await db.emailVerification.update({ where: { id: verification.id }, data: { verified: true } });
    if (verification.userId) {
      await userRepository.verifyEmail(verification.userId);
    }

    return { message: 'Email verified successfully! You can now login.', verified: true };
  }

  async resendVerification(email: string, ip: string) {
    const rateLimit = checkRateLimit(ip, 'resend_verification');
    if (!rateLimit.allowed) return { error: 'Too many requests. Please wait before requesting another code.', resetIn: rateLimit.resetIn, status: 429 };
    if (!email) return { error: 'Email is required', status: 400 };

    const user = await userRepository.findByEmail(email);
    if (!user) return { error: 'No account found with this email', status: 404 };
    if (user.emailVerified) return { error: 'Email is already verified. You can login.', status: 400 };

    const recentOtp = await db.emailVerification.findFirst({
      where: { email: email.toLowerCase(), type: 'registration', createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentOtp) return { error: 'A code was recently sent. Please wait 2 minutes before requesting another.', status: 429 };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.emailVerification.create({
      data: { email: email.toLowerCase(), otp, type: 'registration', expiresAt: new Date(Date.now() + 10 * 60 * 1000), userId: user.id },
    });

    const result = await sendRegistrationOtpEmail(email, otp, user.firstName);
    if (!result.success) return { error: 'Failed to send verification email. Please try again.', status: 500 };

    return { message: 'Verification code sent to your email!' };
  }

  // ============ PASSWORD RESET ============

  async requestPasswordReset(email: string, ip: string) {
    const rateLimit = checkRateLimit(ip, 'password_reset');
    if (!rateLimit.allowed) {
      return { error: 'Too many password reset attempts. Please try again later.', resetIn: rateLimit.resetIn, status: 429 };
    }

    if (!email) return { error: 'Email is required', status: 400 };

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log('[PASSWORD RESET] No account found for: ' + normalizedEmail);
      return { message: 'If an account exists with this email, a verification code has been sent.' };
    }

    if (user.role === 'blocked') {
      return { error: 'Your account has been blocked. Please contact support.', status: 403 };
    }

    // Check if a recent OTP was already sent (2 min cooldown)
    const recentOtp = await db.emailVerification.findFirst({
      where: { email: normalizedEmail, type: 'password_reset', createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentOtp) {
      return { error: 'A reset code was recently sent. Please wait 2 minutes before requesting another.', status: 429 };
    }

    // Generate OTP and store it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.emailVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userId: user.id,
      },
    });

    // Send the password reset email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, otp, user.firstName);
    
    if (!emailResult.success) {
      if (process.env.NODE_ENV !== 'production') console.log('[PASSWORD RESET] SMTP failed for ' + normalizedEmail + ', OTP: ' + otp);
      // Still return success to prevent email enumeration, but log the OTP
      return { message: 'If an account exists with this email, a verification code has been sent.' };
    }

    console.log('[PASSWORD RESET] Code sent to: ' + normalizedEmail);
    return { message: 'If an account exists with this email, a verification code has been sent.' };
  }

  async verifyPasswordReset(email: string, otp: string) {
    if (!email || !otp) return { error: 'Email and verification code are required', status: 400 };

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await db.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        type: 'password_reset',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) return { error: 'Invalid or expired reset code. Please request a new one.', status: 400 };
    if (verification.otp !== otp) return { error: 'Incorrect reset code. Please try again.', status: 400 };

    // Mark verification as verified
    await db.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Create a temporary reset token for the actual password change step (15 min expiry)
    const resetToken = await createToken({ userId: verification.userId, email: normalizedEmail, purpose: 'password_reset', role: 'reset' } as any, '15m');

    return {
      message: 'Verification successful. You can now set your new password.',
      resetToken,
      email: normalizedEmail,
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    if (!resetToken || !newPassword) {
      return { error: 'Reset token and new password are required', status: 400 };
    }

    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters', status: 400 };
    }

    // Verify the reset token
    const decoded: any = await verifyToken(resetToken);
    if (!decoded) {
      return { error: 'Invalid or expired reset token. Please start the password reset process again.', status: 401 };
    }

    if (decoded.purpose !== 'password_reset') {
      return { error: 'Invalid reset token. Please start the password reset process again.', status: 401 };
    }

    const user = await userRepository.findByEmail(decoded.email);
    if (!user) return { error: 'User not found.', status: 404 };
    if (user.role === 'blocked') return { error: 'Your account has been blocked. Please contact support.', status: 403 };

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(user.id, hashedPassword);

    // Invalidate all other password reset OTPs for this email
    await db.emailVerification.updateMany({
      where: { email: decoded.email, type: 'password_reset', verified: true },
      data: { expiresAt: new Date() }, // Force expire
    });

    console.log('[PASSWORD RESET] Password reset successful for: ' + decoded.email);
    return { message: 'Password reset successful! You can now login with your new password.' };
  }

  async adminLoginRequest(email: string) {
    if (!email) return { error: 'Email is required', status: 400 };

    const normalizedEmail = email.toLowerCase().trim();
    const ownerConfig = loadOwnerConfig();
    
    const envAdminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const adminEmails = [
      ownerConfig.ownerEmail,
      ...envAdminEmails,
    ].filter(Boolean).map(e => e.toLowerCase().trim());
    
    if (!adminEmails.includes(normalizedEmail)) return { error: 'This email is not authorized for admin access.', status: 403 };

    const otp = generateOtp();
    const storeResult = storeOtp(normalizedEmail, otp);
    if (!storeResult.success) return { error: storeResult.error, status: 429 };

    const emailResult = await sendOtpEmail(normalizedEmail, otp);
    
    if (process.env.NODE_ENV !== 'production') console.log('[ADMIN LOGIN OTP] Email: ' + normalizedEmail + ', OTP: ' + otp);
    
    if (!emailResult.success) {
      if (process.env.NODE_ENV !== 'production') console.log('[SMTP FAILED] Admin OTP for ' + normalizedEmail + ': ' + otp);
      return { 
        message: 'Verification code generated. Check server logs or try again.', 
        email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      };
    }

    return { message: 'Verification code sent to your email.', email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') };
  }

  async adminLoginVerify(email: string, otp: string) {
    if (!email || !otp) return { error: 'Email and verification code are required', status: 400 };

    const normalizedEmail = email.toLowerCase().trim();
    const ownerConfig = loadOwnerConfig();
    const envAdminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const adminEmails = [ownerConfig.ownerEmail, ...envAdminEmails].filter(Boolean).map(e => e.toLowerCase().trim());
    if (!adminEmails.includes(normalizedEmail)) return { error: 'This email is not authorized for admin access.', status: 403 };

    const verifyResult = verifyOtp(normalizedEmail, otp);
    if (!verifyResult.success) return { error: verifyResult.error, status: 401 };

    let user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      user = await db.user.create({
        data: { email: normalizedEmail, password: hashedPassword, firstName: 'Admin', lastName: 'FahadCloud', role: 'admin', adminRole: 'super_admin', balance: appConfig.admin.defaultBalance, storageLimit: appConfig.admin.defaultStorageLimit, phone: '', company: 'FahadCloud', address: '', city: 'Dhaka', country: 'Bangladesh' },
      });
    } else if (user.role !== 'admin') {
      user = await userRepository.update(user.id, { role: 'admin', adminRole: 'super_admin' });
    }

    await userRepository.updateLastLogin(user!.id, 'admin-otp');

    const token = await createToken({ userId: user!.id, email: user!.email, role: 'admin' });

    return {
      message: 'Admin login successful', token,
      user: { id: user!.id, email: user!.email, firstName: user!.firstName, lastName: user!.lastName, role: user!.role, adminRole: user!.adminRole },
    };
  }

  async requestActionVerification(userId: string, action: string, metadata?: any, ip?: string) {
    const validActions = ['password_change', 'email_change', 'account_delete', 'domain_transfer', 'hosting_delete'];
    if (!action || !validActions.includes(action)) return { error: 'Invalid action type', status: 400 };

    const recentOtp = await db.actionVerification.findFirst({
      where: { userId, action, createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentOtp && !recentOtp.verified) return { error: 'A verification code was recently sent. Please wait 2 minutes.', status: 429 };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.actionVerification.create({
      data: { userId, action, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), metadata: metadata ? JSON.stringify(metadata) : null },
    });

    const user = await userRepository.findById(userId);
    if (!user) return { error: 'User not found', status: 404 };

    const result = await sendActionVerificationEmail(user.email, otp, action);
    if (!result.success) return { error: 'Failed to send verification email. Please try again.', status: 500 };

    return { message: 'Verification code sent to your email!' };
  }

  async verifyAction(userId: string, action: string, otp: string) {
    if (!action || !otp) return { error: 'Action and verification code are required', status: 400 };

    const verification = await db.actionVerification.findFirst({
      where: { userId, action, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) return { error: 'Invalid or expired verification code. Please request a new one.', status: 400 };
    if (verification.otp !== otp) return { error: 'Incorrect verification code.', status: 400 };

    await db.actionVerification.update({ where: { id: verification.id }, data: { verified: true } });

    return { message: 'Action verified successfully', action, verified: true, metadata: verification.metadata ? JSON.parse(verification.metadata) : null };
  }
}

export const authService = new AuthService();
