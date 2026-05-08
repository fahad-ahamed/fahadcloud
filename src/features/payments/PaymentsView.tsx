'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard } from 'lucide-react';
import { statusColor } from '@/lib/formatters';
import type { OrderItem } from '@/types';

interface PaymentsViewProps {
  paymentOrder: any;
  bkashNumber: string;
  setBkashNumber: (v: string) => void;
  bkashTrxId: string;
  setBkashTrxId: (v: string) => void;
  paymentProcessing: boolean;
  orders: OrderItem[];
  ordersLoading: boolean;
  onSubmitPayment: () => void;
}

export default function PaymentsView({
  paymentOrder, bkashNumber, setBkashNumber,
  bkashTrxId, setBkashTrxId, paymentProcessing,
  orders, ordersLoading, onSubmitPayment,
}: PaymentsViewProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500/20">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">Payment via bKash</h2>
          <p className="text-slate-500">Pay securely using bKash mobile banking</p>
        </CardContent>
      </Card>

      {paymentOrder && (
        <Card className="bg-white border-slate-200 shadow-sm border-emerald-200">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="space-y-3">
              <div>
                <Label className="text-slate-600">bKash Number</Label>
                <Input className="bg-white border-slate-300" placeholder="01XXXXXXXXX" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} />
              </div>
              <div>
                <Label className="text-slate-600">Transaction ID (TRXID)</Label>
                <Input className="bg-white border-slate-300" placeholder="Enter your bKash TRX ID" value={bkashTrxId} onChange={e => setBkashTrxId(e.target.value)} />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={onSubmitPayment} disabled={paymentProcessing}>
                {paymentProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Submit Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500 space-y-2">
          <p>1. Send ৳{paymentOrder?.price?.toFixed(0) || '---'} to bKash number: <span className="text-slate-900 font-medium">01712345678</span></p>
          <p>2. Copy the Transaction ID (TRXID) from the confirmation message</p>
          <p>3. Enter your bKash number and TRX ID above</p>
          <p>4. Your payment will be verified within 5-30 minutes</p>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
              <span className="text-slate-500">Loading orders...</span>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-left">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id || i} className="border-t border-slate-100">
                      <td className="py-2 font-mono text-xs">{o.id?.substring(0, 8)}...</td>
                      <td className="py-2">{o.type || o.description}</td>
                      <td className="py-2">৳{o.amount?.toFixed(0)}</td>
                      <td className="py-2"><Badge className={statusColor(o.status)}>{o.status}</Badge></td>
                      <td className="py-2 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No orders yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
