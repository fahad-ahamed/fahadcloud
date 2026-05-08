'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  paymentOrder: any;
  bkashNumber: string;
  setBkashNumber: (v: string) => void;
  bkashTrxId: string;
  setBkashTrxId: (v: string) => void;
  paymentProcessing: boolean;
  onSubmit: () => void;
}

export default function PaymentDialog({
  open, onOpenChange,
  paymentOrder, bkashNumber, setBkashNumber,
  bkashTrxId, setBkashTrxId, paymentProcessing,
  onSubmit,
}: PaymentDialogProps) {
  if (!paymentOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Payment - ৳{paymentOrder.price?.toFixed(0) || '0'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Item</span>
              <span>{paymentOrder.domain || paymentOrder.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="text-xl font-bold text-emerald-600">৳{paymentOrder.price?.toFixed(0) || '0'}</span>
            </div>
          </div>
          <div>
            <Label className="text-slate-600">bKash Number</Label>
            <Input className="bg-white border-slate-300" placeholder="01XXXXXXXXX" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} />
          </div>
          <div>
            <Label className="text-slate-600">Transaction ID (TRXID)</Label>
            <Input className="bg-white border-slate-300" placeholder="Enter your bKash TRX ID" value={bkashTrxId} onChange={e => setBkashTrxId(e.target.value)} />
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={onSubmit} disabled={paymentProcessing}>
            {paymentProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Submit Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
