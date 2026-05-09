'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Lock, Loader2, Check } from 'lucide-react';

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  regOtp: string;
  setRegOtp: (v: string) => void;
  regOtpLoading: boolean;
  regVerifyLoading: boolean;
  regPendingEmail: string;
  authError: string;
  onVerify: () => void;
  onResend: () => void;
}

export default function EmailVerificationDialog({
  open, onOpenChange,
  regOtp, setRegOtp,
  regOtpLoading, regVerifyLoading,
  regPendingEmail, authError,
  onVerify, onResend,
}: EmailVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-slate-500">We sent a verification code to your email address</DialogDescription>
        </DialogHeader>
        {authError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{authError}</div>}
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">Verification code sent to <strong>{regPendingEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</strong></p>
          </div>
          <div>
            <Label className="text-slate-600">Verification Code</Label>
            <Input className="bg-white border-slate-300 text-slate-900 text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono"
              value={regOtp} onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6} onKeyDown={e => e.key === 'Enter' && onVerify()} autoFocus />
            <p className="text-xs text-slate-400 mt-1 text-center">6-digit code expires in 10 minutes</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Check your <b>Spam/Junk</b> folder if you don not see the email in your inbox.</span>
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={onVerify} disabled={regVerifyLoading}>
            {regVerifyLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : <><Check className="w-4 h-4 mr-2" /> Verify Email</>}
          </Button>
          <div className="text-center">
            <button className="text-sm text-emerald-600 hover:underline disabled:opacity-50" onClick={onResend} disabled={regOtpLoading}>
              {regOtpLoading ? 'Sending...' : "Didn't receive the code? Resend"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
