'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Mail, Loader2, Trash2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actionVerifyStep: 'idle' | 'request' | 'verify';
  actionVerifyOtp: string;
  setActionVerifyOtp: (v: string) => void;
  actionVerifyLoading: boolean;
  deleteAccountLoading: boolean;
  onRequestVerify: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function DeleteAccountDialog({
  open, onOpenChange,
  actionVerifyStep, actionVerifyOtp,
  setActionVerifyOtp, actionVerifyLoading,
  deleteAccountLoading,
  onRequestVerify, onDelete, onCancel,
}: DeleteAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-slate-500">This action is permanent and cannot be undone</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {actionVerifyStep === 'idle' ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium mb-2">Warning: All your data will be permanently deleted</p>
                <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                  <li>All your domains will be released</li>
                  <li>Hosting environments will be terminated</li>
                  <li>Files and databases will be deleted</li>
                  <li>Payment history will be removed</li>
                  <li>This cannot be reversed</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onRequestVerify} disabled={actionVerifyLoading}>
                  {actionVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Verification Code
                </Button>
                <Button variant="outline" className="border-slate-300" onClick={onCancel}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Enter the verification code to confirm deletion</p>
              </div>
              <div>
                <Label className="text-slate-600">Verification Code</Label>
                <Input className="bg-white border-slate-300 text-slate-900 text-center text-2xl tracking-[0.5em] font-mono" value={actionVerifyOtp} onChange={e => setActionVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
              </div>
              <div className="flex gap-2">
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onDelete} disabled={deleteAccountLoading}>
                  {deleteAccountLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete My Account
                </Button>
                <Button variant="outline" className="border-slate-300" onClick={onCancel}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
