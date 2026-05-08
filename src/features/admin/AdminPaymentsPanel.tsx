'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { statusColor } from '@/lib/formatters';

interface AdminPaymentsPanelProps {
  adminPayments: any[];
  adminLoading: boolean;
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string) => void;
}

export default function AdminPaymentsPanel({
  adminPayments, adminLoading,
  onApprovePayment, onRejectPayment,
}: AdminPaymentsPanelProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {adminLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
            <span className="text-slate-500">Loading payments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">TRX ID</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminPayments.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-2">{p.orderId?.substring(0, 8)}...</td>
                    <td className="py-2 text-slate-500">{p.userId?.substring(0, 8)}...</td>
                    <td className="py-2">৳{p.amount?.toFixed(0)}</td>
                    <td className="py-2 font-mono text-xs">{p.trxId || '-'}</td>
                    <td className="py-2"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                    <td className="py-2">
                      {p.status === 'pending' || p.status === 'verifying' ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprovePayment(p.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-red-200 text-red-500" onClick={() => onRejectPayment(p.id)}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {adminPayments.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-slate-400">No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
