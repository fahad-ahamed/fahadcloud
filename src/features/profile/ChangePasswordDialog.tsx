// @ts-nocheck
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Key, Loader2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: (v: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
  passwordSaving: boolean;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  actionVerifyStep: 'idle' | 'request' | 'verify';
  setActionVerifyStep: (v: 'idle' | 'request' | 'verify') => void;
  actionVerifyOtp: string;
  setActionVerifyOtp: (v: string) => void;
  actionVerifyLoading: boolean;
  actionVerifyAction: string;
  onChangePassword: () => void;
}

export default function ChangePasswordDialog({
  open, onOpenChange,
  passwordForm, setPasswordForm, passwordSaving,
  showCurrentPassword, setShowCurrentPassword,
  showNewPassword, setShowNewPassword,
  actionVerifyStep, setActionVerifyStep,
  actionVerifyOtp, setActionVerifyOtp,
  actionVerifyLoading, actionVerifyAction,
  onChangePassword,
}: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-600">Current Password</Label>
            <div className="relative">
              <Input className="bg-white border-slate-300 text-slate-900 pr-10" type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-slate-600">New Password</Label>
            <div className="relative">
              <Input className="bg-white border-slate-300 text-slate-900 pr-10" type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-slate-600">Confirm New Password</Label>
            <Input className="bg-white border-slate-300 text-slate-900" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
          </div>
          {actionVerifyStep === 'verify' && actionVerifyAction === 'password_change' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Email Verification Required</span>
              </div>
              <p className="text-xs text-amber-600">A verification code has been sent to your email.</p>
              <div>
                <Label className="text-slate-600">Verification Code</Label>
                <Input className="bg-white border-slate-300 text-slate-900 text-center text-xl tracking-[0.3em] font-mono" value={actionVerifyOtp} onChange={e => setActionVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {actionVerifyStep === 'verify' && actionVerifyAction === 'password_change' ? (
              <>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={onChangePassword} disabled={actionVerifyLoading}>
                  {actionVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span className="w-4 h-4 mr-2">✓</span>}
                  Verify & Update Password
                </Button>
                <Button variant="outline" className="border-slate-300" onClick={() => { setActionVerifyStep('idle'); setActionVerifyOtp(''); }}>Cancel Verification</Button>
              </>
            ) : (
              <>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={onChangePassword} disabled={passwordSaving || actionVerifyLoading}>
                  {passwordSaving || actionVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                  Verify & Update Password
                </Button>
                <Button variant="outline" className="border-slate-300" onClick={() => onOpenChange(false)}>Cancel</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
