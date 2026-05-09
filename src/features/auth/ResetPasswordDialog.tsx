'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound, Loader2, Check, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/services/api';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resetEmail: string;
  onSwitchToLogin: () => void;
  onSwitchToForgot: () => void;
}

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  resetEmail,
  onSwitchToLogin,
  onSwitchToForgot,
}: ResetPasswordDialogProps) {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.verifyPasswordReset(resetEmail, otp.trim());
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setStep('reset');
        setSuccess('');
      }
    } catch (e: any) {
      setError(e.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(resetToken, newPassword);
      setSuccess('Password reset successful! You can now login with your new password.');
      // Auto-switch to login after a short delay
      setTimeout(() => {
        setStep('verify');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        setError('');
        setSuccess('');
        onSwitchToLogin();
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    try {
      await apiClient.requestPasswordReset(resetEmail);
    } catch (e: any) {
      setError(e.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'verify' ? (
              <>
                <ShieldCheck className="w-5 h-5 text-red-500" />
                Verify Reset Code
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5 text-emerald-600" />
                Set New Password
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {step === 'verify'
              ? 'Enter the code sent to your email'
              : 'Create a new secure password'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg">
            {success}
          </div>
        )}

        {step === 'verify' ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-slate-500">
                Verification code sent to <strong>{resetEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</strong>
              </p>
            </div>

            <div>
              <Label className="text-slate-600">Verification Code</Label>
              <Input
                className="bg-white border-slate-300 text-slate-900 text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1 text-center">6-digit code expires in 10 minutes</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 flex items-center gap-1.5 mt-2">
                <span>⚠️</span>
                <span>Check your <b>Spam/Junk</b> folder if you don't see the email in your inbox.</span>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-11 transition-all"
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <button
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
              </button>
              <br />
              <button
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
                onClick={onSwitchToForgot}
              >
                <ArrowLeft className="w-3 h-3" />
                Try different email
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <KeyRound className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500">
                Verified! Create your new password below.
              </p>
            </div>

            <div>
              <Label className="text-slate-600">New Password</Label>
              <div className="relative">
                <Input
                  className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10 pr-10"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoFocus
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-slate-600">Confirm New Password</Label>
              <div className="relative">
                <Input
                  className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10 pr-10"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-xs text-green-500 mt-1">Passwords match ✓</p>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11 transition-all"
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
