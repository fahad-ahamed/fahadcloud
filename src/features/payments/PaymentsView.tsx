'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle2, Sparkles, Zap, Globe, Shield, HardDrive, Brain, Server } from 'lucide-react';
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
  orders, ordersLoading,
}: PaymentsViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Free Banner */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">100% FREE Platform</h2>
          <p className="text-emerald-100 text-lg mb-4">All domains, hosting, SSL, AI agents, and storage are completely free. No credit card needed. No hidden charges. Forever.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><Zap className="w-3 h-3 mr-1" /> Unlimited Domains</Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><HardDrive className="w-3 h-3 mr-1" /> 100GB Storage</Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><Brain className="w-3 h-3 mr-1" /> 14 AI Agents</Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><Shield className="w-3 h-3 mr-1" /> Free SSL</Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><Server className="w-3 h-3 mr-1" /> Free Hosting</Badge>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1"><Globe className="w-3 h-3 mr-1" /> Free DNS</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Free Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Domain Registration</h3>
                <p className="text-xs text-slate-500">Any TLD, instantly activated</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Register any domain for free with automatic DNS configuration and hosting setup. No limits on the number of domains.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">14 AI Agents</h3>
                <p className="text-xs text-slate-500">Full access to all agents</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Get full access to all 14 AI agents including DevOps, Security, Monitoring, SSL, Database, and more. No usage limits.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">SSL Certificates</h3>
                <p className="text-xs text-slate-500">Let's Encrypt, auto-renewal</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Free SSL certificates on all domains with automatic provisioning and renewal. Full HTTPS security included.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">100GB Cloud Storage</h3>
                <p className="text-xs text-slate-500">Unlimited file hosting</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">100GB of cloud storage for all your files with file manager, public sharing links, and CDN delivery.</p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-slate-500">Loading orders...</span>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
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
                      <td className="py-2"><Badge className="bg-emerald-100 text-emerald-700">FREE</Badge></td>
                      <td className="py-2"><Badge className="bg-emerald-100 text-emerald-700">Active</Badge></td>
                      <td className="py-2 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Gift className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p>No orders yet. Everything is free!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
