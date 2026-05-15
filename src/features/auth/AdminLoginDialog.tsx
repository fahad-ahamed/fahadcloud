'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Mail, Lock, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adminEmail: string;
  setAdminEmail: (v: string) => void;
  adminOtpSent: boolean;
  setAdminOtpSent: (v: boolean) => void;
  adminOtp: string;
  setAdminOtp: (v: string) => void;
  adminOtpLoading: boolean;
  adminVerifyLoading: boolean;
  adminError: string;
  setAdminError: (v: string) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onAdminPasswordLogin?: (email: string, password: string) => Promise<void>;
}

export default function AdminLoginDialog({
  open, onOpenChange,
  adminEmail, setAdminEmail,
  adminOtpSent, setAdminOtpSent,
  adminOtp, setAdminOtp,
  adminOtpLoading, adminVerifyLoading,
  adminError, setAdminError,
  onRequestOtp, onVerifyOtp,
  onAdminPasswordLogin,
}: AdminLoginDialogProps) {
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordLogin = async () => {
    setAdminError('');
    if (!adminEmail.trim()) { setAdminError('Please enter your email'); return; }
    if (!adminPassword) { setAdminError('Please enter your password'); return; }
    
    setPasswordLoading(true);
    try {
      if (onAdminPasswordLogin) {
        await onAdminPasswordLogin(adminEmail.trim(), adminPassword);
      }
    } catch (e: any) {
      setAdminError?.(e.message || 'Login failed');
    }
    setPasswordLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Admin Login
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Access the FahadCloud admin panel
          </DialogDescription>
        </DialogHeader>
        {adminError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{adminError}</div>}

        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'password' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setLoginMethod('password'); setAdminError?.(''); }}
          >
            <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
            Password Login
          </button>
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'otp' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setLoginMethod('otp'); setAdminOtpSent(false); setAdminError?.(''); }}
          >
            <Mail className="w-3.5 h-3.5 inline mr-1.5" />
            OTP Login
          </button>
        </div>

        {loginMethod === 'password' ? (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-600">Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="bg-white border-slate-300 text-slate-900 pl-10"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@fahadcloud.com or admin"
                  onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="bg-white border-slate-300 text-slate-900 pl-10 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11"
              onClick={handlePasswordLogin}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
              ) : (
                <><Shield className="w-4 h-4 mr-2" /> Login as Admin</>
              )}
            </Button>
          </div>
        ) : (
          !adminOtpSent ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-600">Owner Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="bg-white border-slate-300 text-slate-900 pl-10"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    onKeyDown={e => e.key === 'Enter' && onRequestOtp()}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Only the registered owner email can access admin panel</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={onRequestOtp}
                disabled={adminOtpLoading}
              >
                {adminOtpLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Code...</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" /> Send Verification Code</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Lock className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Verification code sent to <strong>{adminEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</strong>
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Verification Code</Label>
                <Input
                  className="bg-white border-slate-300 text-slate-900 text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono"
                  value={adminOtp}
                  onChange={e => setAdminOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && onVerifyOtp()}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1 text-center">6-digit code expires in 10 minutes</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={onVerifyOtp}
                disabled={adminVerifyLoading}
              >
                {adminVerifyLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" /> Verify & Login</>
                )}
              </Button>
              <div className="text-center">
                <button
                  className="text-sm text-emerald-600 hover:underline"
                  onClick={() => { setAdminOtpSent(false); setAdminOtp(''); }}
                >
                  Didn't get the code? Try again
                </button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
