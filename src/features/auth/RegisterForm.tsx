'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  regName: string;
  setRegName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPhone: string;
  setRegPhone: (v: string) => void;
  regPass: string;
  setRegPass: (v: string) => void;
  authError: string;
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({
  open, onOpenChange,
  regName, setRegName,
  regEmail, setRegEmail,
  regPhone, setRegPhone,
  regPass, setRegPass,
  authError, onRegister,
  onSwitchToLogin,
}: RegisterFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription className="text-slate-500">Join FahadCloud and get started</DialogDescription>
        </DialogHeader>
        {authError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg animate-shake">{authError}</div>}
        <div className="space-y-4">
          <div>
            <Label className="text-slate-600">Full Name</Label>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" value={regName} onChange={e => setRegName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label className="text-slate-600">Email</Label>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-slate-600">Phone</Label>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" />
          </div>
          <div>
            <Label className="text-slate-600">Password</Label>
            <Input className="bg-white border-slate-200 text-slate-900 focus:border-emerald-400 h-10" type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>You will receive a verification code on your email. You must verify before you can login.</span>
          </div>
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11 transition-all" onClick={onRegister}>
            Create Account & Verify Email
          </Button>
          <div className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button className="text-emerald-600 hover:underline" onClick={onSwitchToLogin}>
              Login
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
