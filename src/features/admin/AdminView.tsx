'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Globe, Package, DollarSign, Loader2,
  MessageSquare, Activity, Terminal, Brain,
  ShieldAlert, Power, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColor } from '@/lib/formatters';

interface AdminViewProps {
  adminStats: any;
  adminUsers: any[];
  adminPayments: any[];
  aiAdminStats: any;
  adminLoading: boolean;
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string) => void;
  onEmergencyShutdown: () => void;
  onClearMemory: () => void;
  onRefresh: () => void;
}

export default function AdminView({
  adminStats, adminUsers, adminPayments, aiAdminStats,
  adminLoading,
  onApprovePayment, onRejectPayment,
  onEmergencyShutdown, onClearMemory,
  onRefresh,
}: AdminViewProps) {
  return (
    <div className="space-y-6">
      {adminLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
          <span className="text-slate-500">Loading admin data...</span>
        </div>
      )}
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100 border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ai_admin">AI System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: adminStats?.overview?.totalUsers || adminStats?.totalUsers || 0, icon: Users, color: 'from-emerald-500 to-teal-500' },
              { label: 'Total Domains', value: adminStats?.overview?.totalDomains || adminStats?.totalDomains || 0, icon: Globe, color: 'from-emerald-500 to-teal-500' },
              { label: 'Total Orders', value: adminStats?.overview?.totalOrders || adminStats?.totalOrders || 0, icon: Package, color: 'from-emerald-500 to-teal-500' },
              { label: 'Revenue', value: `৳${(adminStats?.overview?.totalRevenue || adminStats?.totalRevenue || 0).toFixed(0)}`, icon: DollarSign, color: 'from-yellow-500 to-orange-500' },
            ].map((s, i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2', s.color)}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Users</CardTitle>
            </CardHeader>
            <CardContent>
              {adminLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
                  <span className="text-slate-500">Loading users...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Balance</th>
                        <th className="pb-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u: any) => (
                        <tr key={u.id} className="border-t border-slate-100">
                          <td className="py-2">{u.firstName} {u.lastName}</td>
                          <td className="py-2 text-slate-500">{u.email}</td>
                          <td className="py-2"><Badge className={statusColor(u.role)}>{u.role}</Badge></td>
                          <td className="py-2">৳{u.balance?.toFixed(0)}</td>
                          <td className="py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {adminUsers.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-400">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
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
        </TabsContent>

        <TabsContent value="ai_admin" className="mt-4 space-y-4">
          {/* AI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'AI Sessions', value: aiAdminStats?.stats?.totalSessions || 0, icon: MessageSquare },
              { label: 'AI Tasks', value: aiAdminStats?.stats?.totalTasks || 0, icon: Activity },
              { label: 'Tool Executions', value: aiAdminStats?.stats?.totalToolExecutions || 0, icon: Terminal },
              { label: 'Memory Entries', value: aiAdminStats?.stats?.totalMemories || 0, icon: Brain },
            ].map((s, i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <s.icon className="w-8 h-8 text-teal-600 mb-2" />
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Emergency Shutdown */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Emergency Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Emergency shutdown will cancel all running AI tasks and disable the AI agent system.</p>
              <Button className="bg-red-600 hover:bg-red-700" onClick={onEmergencyShutdown}>
                <Power className="w-4 h-4 mr-2" />
                Emergency Shutdown
              </Button>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {aiAdminStats?.stats?.pendingApprovals > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-600">Pending Approvals ({aiAdminStats.stats.pendingApprovals})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Tasks requiring admin approval are in the AI Agent chat panel.</p>
              </CardContent>
            </Card>
          )}

          {/* Suspicious Activities */}
          {aiAdminStats?.suspiciousActivities?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Suspicious Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiAdminStats.suspiciousActivities.slice(0, 10).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                    <AlertTriangle className={cn('w-3 h-3', a.riskLevel === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                    <span className="text-slate-600">{a.tool}</span>
                    <span className="text-slate-400 ml-auto">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Clear AI Memory */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">AI Memory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">Clear AI agent memory for all users or specific users.</p>
              <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50" onClick={onClearMemory}>
                Clear All Memory
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
