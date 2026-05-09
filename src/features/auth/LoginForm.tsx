'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LoginFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPass: string;
  setLoginPass: (v: string) => void;
  authError: string;
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToVerify: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginForm({
  open, onOpenChange,
  loginEmail, setLoginEmail,
  loginPass, setLoginPass,
  authError, onLogin,
  onSwitchToRegister, onSwitchToVerify,
  onSwitchToForgotPassword,
}: LoginFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome Back</DialogTitle>
          <DialogDescription className="text-slate-500">Login to your FahadCloud account</DialogDescription>
        </DialogHeader>
        {authError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg animate-shake">{authError}</div>}
        <div className="space-y-4">
          <div>
            <Label className="text-slate-600">Email</Label>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-600">Password</Label>
              <button
                className="text-xs text-red-500 hover:text-red-600 hover:underline"
                onClick={onSwitchToForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && onLogin()} />
          </div>
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11 transition-all" onClick={onLogin}>
            Login
          </Button>
          <div className="text-center text-sm text-slate-500 space-y-1">
            <div>
              Don&apos;t have an account?{' '}
              <button className="text-emerald-600 hover:underline" onClick={onSwitchToRegister}>
                Register
              </button>
            </div>
            <div>
              <button className="text-amber-600 hover:underline text-xs" onClick={onSwitchToVerify}>
                Didn&apos;t receive verification code?
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
