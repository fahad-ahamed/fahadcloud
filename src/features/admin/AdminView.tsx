'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Globe, Package, DollarSign, Loader2,
  MessageSquare, Activity, Terminal, Brain,
  ShieldAlert, Power, AlertTriangle, UserX, UserCheck, Trash2, Shield,
  ChevronLeft, ChevronRight, RefreshCw, Search, Lock, Eye, EyeOff, Key,
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
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

// Skeleton loader component
function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-3"><div className="skeleton skeleton-text w-24" /></td>
      <td className="py-3"><div className="skeleton skeleton-text w-32" /></td>
      <td className="py-3"><div className="skeleton skeleton-text w-16" /></td>
      <td className="py-3"><div className="skeleton skeleton-text w-16" /></td>
      <td className="py-3"><div className="skeleton skeleton-text w-20" /></td>
      <td className="py-3"><div className="skeleton skeleton-text w-16" /></td>
    </tr>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="skeleton w-10 h-10 rounded-xl mb-2" />
        <div className="skeleton skeleton-heading w-16 mb-1" />
        <div className="skeleton skeleton-text w-20" />
      </CardContent>
    </Card>
  );
}

export default function AdminView({
  adminStats, adminUsers, adminPayments, aiAdminStats,
  adminLoading,
  onApprovePayment, onRejectPayment,
  onEmergencyShutdown, onClearMemory,
  onRefresh,
  onBlockUser, onUnblockUser, onDeleteUser,
}: AdminViewProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPasswordChanging(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (e: any) {
      setPasswordMessage({ type: 'error', text: e.message || 'Network error' });
    }
    setPasswordChanging(false);
  };

  const filteredUsers = userSearch
    ? adminUsers.filter((u: any) =>
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(userSearch.toLowerCase())
      )
    : adminUsers;

  const filteredPayments = adminPayments;

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100 border-slate-200 w-full overflow-x-auto flex-shrink-0">
          <TabsTrigger value="overview" className="transition-all text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="users" className="transition-all text-xs sm:text-sm">Users</TabsTrigger>
          <TabsTrigger value="payments" className="transition-all text-xs sm:text-sm">Payments</TabsTrigger>
          <TabsTrigger value="security" className="transition-all text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="ai_admin" className="transition-all text-xs sm:text-sm">AI System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Dashboard Overview</h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-slate-500 hover:text-emerald-600">
              <RefreshCw className={cn('w-4 h-4 mr-1', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {adminLoading ? (
              Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              [
                { label: 'Total Users', value: adminStats?.overview?.totalUsers || adminStats?.totalUsers || 0, icon: Users, color: 'from-emerald-500 to-teal-500' },
                { label: 'Active Users', value: adminStats?.overview?.activeUsers || 0, icon: UserCheck, color: 'from-emerald-500 to-teal-500' },
                { label: 'Blocked Users', value: adminStats?.overview?.blockedUsers || 0, icon: UserX, color: 'from-red-500 to-pink-500' },
                { label: 'Total Domains', value: adminStats?.overview?.totalDomains || adminStats?.totalDomains || 0, icon: Globe, color: 'from-emerald-500 to-teal-500' },
                { label: 'Total Orders', value: adminStats?.overview?.totalOrders || adminStats?.totalOrders || 0, icon: Package, color: 'from-emerald-500 to-teal-500' },
                { label: 'Revenue', value: `৳${(adminStats?.overview?.totalRevenue || adminStats?.totalRevenue || 0).toFixed(0)}`, icon: DollarSign, color: 'from-yellow-500 to-orange-500' },
                { label: 'Pending Payments', value: adminStats?.overview?.pendingPayments || 0, icon: DollarSign, color: 'from-amber-500 to-yellow-500' },
                { label: 'Unverified Users', value: adminStats?.overview?.unverifiedUsers || 0, icon: Shield, color: 'from-slate-500 to-gray-500' },
              ].map((s, i) => (
                <Card key={i} className="bg-white border-slate-200 shadow-sm card-hover">
                  <CardContent className="p-4">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2', s.color)}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4 page-transition">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg">Users ({adminUsers.length})</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 w-full sm:w-auto"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-slate-500 hover:text-emerald-600">
                    <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {adminLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Balance</th>
                        <th className="pb-2 font-medium">Joined</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Balance</th>
                        <th className="pb-3 font-medium">Joined</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u: any, idx: number) => (
                        <tr key={u.id} className={cn(
                          'border-t border-slate-100 table-row-hover',
                          u.isBlocked && 'bg-red-50/30',
                        )} style={{ animationDelay: `${idx * 30}ms` }}>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white',
                                u.isBlocked ? 'bg-red-400' : 'bg-gradient-to-br from-emerald-500 to-teal-600')}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500">{u.email}</td>
                          <td className="py-3">
                            <Badge className={cn(statusColor(u.role), 'badge-transition')}>{u.role}</Badge>
                          </td>
                          <td className="py-3 font-medium">৳{u.balance?.toFixed(0)}</td>
                          <td className="py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            {u.email === 'admin@fahadcloud.com' || u.adminRole === 'super_admin' ? (
                              <span className="text-slate-400 text-xs italic">Super Admin</span>
                            ) : (
                              <div className="flex gap-1.5">
                                {u.isBlocked || u.role === 'blocked' ? (
                                  <Button
                                    size="sm"
                                    className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 px-2.5"
                                    onClick={() => onUnblockUser?.(u.id)}
                                    title="Unblock user"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                    Unblock
                                  </Button>
                                ) : confirmBlock === u.id ? (
                                  <div className="flex gap-1 animate-scale-in">
                                    <Button size="sm" className="h-7 text-[11px] bg-amber-600 hover:bg-amber-700 px-2.5" onClick={() => { onBlockUser?.(u.id); setConfirmBlock(null); }}>
                                      Confirm
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => setConfirmBlock(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] border-amber-200 text-amber-600 hover:bg-amber-50 px-2.5"
                                    onClick={() => setConfirmBlock(u.id)}
                                    title="Block user"
                                  >
                                    <UserX className="w-3.5 h-3.5 mr-1" />
                                    Block
                                  </Button>
                                )}
                                {confirmDelete === u.id ? (
                                  <div className="flex gap-1 animate-scale-in">
                                    <Button size="sm" className="h-7 text-[11px] bg-red-600 hover:bg-red-700 px-2.5" onClick={() => { onDeleteUser?.(u.id); setConfirmDelete(null); }}>
                                      Delete
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" onClick={() => setConfirmDelete(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] border-red-200 text-red-500 hover:bg-red-50 destructive-hover px-2.5"
                                    onClick={() => setConfirmDelete(u.id)}
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center">
                            <div className="text-slate-400">
                              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">No users found</p>
                              {userSearch && <p className="text-xs mt-1">Try a different search term</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 page-transition">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Payments ({adminPayments.length})</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-slate-500 hover:text-emerald-600">
                  <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-3 font-medium">Order</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">TRX ID</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-3 font-medium">Order</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">TRX ID</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p: any) => (
                        <tr key={p.id} className="border-t border-slate-100 table-row-hover">
                          <td className="py-3 font-mono text-xs">{p.orderId?.substring(0, 8)}...</td>
                          <td className="py-3 text-slate-500 font-mono text-xs">{p.userId?.substring(0, 8)}...</td>
                          <td className="py-3 font-semibold">৳{p.amount?.toFixed(0)}</td>
                          <td className="py-3 font-mono text-xs">{p.trxId || <span className="text-slate-300">-</span>}</td>
                          <td className="py-3"><Badge className={cn(statusColor(p.status), 'badge-transition')}>{p.status}</Badge></td>
                          <td className="py-3">
                            {p.status === 'pending' || p.status === 'verifying' ? (
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 px-2.5" onClick={() => onApprovePayment(p.id)}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-200 text-red-500 hover:bg-red-50 px-2.5" onClick={() => onRejectPayment(p.id)}>
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center">
                            <div className="text-slate-400">
                              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">No payments found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4 page-transition">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                Change Admin Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                )}>
                  {passwordMessage.text}
                </div>
              )}
              <div>
                <Label className="text-slate-600">Current Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="bg-white border-slate-300 text-slate-900 pl-10 pr-10"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-slate-600">New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="bg-white border-slate-300 text-slate-900 pl-10 pr-10"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="bg-white border-slate-300 text-slate-900 pl-10"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 w-full sm:w-auto"
                onClick={handleChangePassword}
                disabled={passwordChanging}
              >
                {passwordChanging ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</>
                ) : (
                  <><Key className="w-4 h-4 mr-2" /> Change Password</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Security Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-500">
              <p>Admin passwords must be at least 6 characters long.</p>
              <p>Password changes take effect immediately for future logins.</p>
              <p>For security, you will need to re-login after changing your password.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai_admin" className="mt-4 space-y-4 page-transition">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {[
              { label: 'AI Sessions', value: aiAdminStats?.stats?.totalSessions || 0, icon: MessageSquare },
              { label: 'AI Tasks', value: aiAdminStats?.stats?.totalTasks || 0, icon: Activity },
              { label: 'Tool Executions', value: aiAdminStats?.stats?.totalToolExecutions || 0, icon: Terminal },
              { label: 'Memory Entries', value: aiAdminStats?.stats?.totalMemories || 0, icon: Brain },
            ].map((s, i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm card-hover">
                <CardContent className="p-4">
                  <s.icon className="w-8 h-8 text-teal-600 mb-2" />
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                <ShieldAlert className="w-5 h-5" />
                Emergency Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Emergency shutdown will cancel all running AI tasks and disable the AI agent system.</p>
              <Button className="bg-red-600 hover:bg-red-700 transition-all w-full sm:w-auto" onClick={onEmergencyShutdown}>
                <Power className="w-4 h-4 mr-2" />
                Emergency Shutdown
              </Button>
            </CardContent>
          </Card>

          {aiAdminStats?.stats?.pendingApprovals > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-600 text-base">Pending Approvals ({aiAdminStats.stats.pendingApprovals})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Tasks requiring admin approval are in the AI Agent chat panel.</p>
              </CardContent>
            </Card>
          )}

          {aiAdminStats?.suspiciousActivities?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Suspicious Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiAdminStats.suspiciousActivities.slice(0, 10).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                    <AlertTriangle className={cn('w-3 h-3 flex-shrink-0', a.riskLevel === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                    <span className="text-slate-600">{a.tool}</span>
                    <span className="text-slate-400 ml-auto">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">AI Memory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">Clear AI agent memory for all users or specific users.</p>
              <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 transition-all" onClick={onClearMemory}>
                Clear All Memory
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
