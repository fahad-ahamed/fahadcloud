'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/services/api';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSwitchToLogin: () => void;
  onSwitchToReset: (email: string) => void;
}

export default function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  onSwitchToReset,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.requestPasswordReset(email.trim());
      setSuccess(result.message || 'If an account exists with this email, a verification code has been sent.');
      // Auto-switch to reset dialog after a short delay
      setTimeout(() => {
        onSwitchToReset(email.trim());
        setSuccess('');
      }, 1500);
    } catch (e: any) {
      // Rate limit or other error - still show it
      setError(e.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-red-500" />
            Forgot Password
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Enter your email to receive a password reset code
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

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-3">
              <KeyRound className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-slate-500">
              Enter the email address associated with your account and we will send you a verification code to reset your password.
            </p>
          </div>

          <div>
            <Label className="text-slate-600">Email Address</Label>
            <Input
              className="bg-white border-slate-200 text-slate-900 focus:border-red-400 h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleRequestReset()}
              autoFocus
            />
          </div>

          <Button
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-11 transition-all"
            onClick={handleRequestReset}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Reset Code...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                Send Reset Code
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
              onClick={onSwitchToLogin}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Login
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
