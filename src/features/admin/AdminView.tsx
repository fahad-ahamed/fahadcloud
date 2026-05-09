'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  Wifi, WifiOff, Clock, Monitor, Server, HardDrive, Zap, CreditCard,
  ArrowLeft, Mail, Phone, MapPin, Building, Database, FileText, Send,
  Edit3, Save, X, DollarSignIcon, AlertCircle, CheckCircle, Settings,
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

// ============ LIVE MONITOR TAB ============
function LiveMonitorTab() {
  const [activities, setActivities] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLiveData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/live-monitor?filter=${filter}&limit=100&hours=24`);
      const data = await res.json();
      setActivities(data.activities || []);
      setOnlineUsers(data.onlineUsers || []);
      setStats(data.stats || null);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadLiveData();
  }, [loadLiveData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadLiveData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, loadLiveData]);

  const categoryIcon: Record<string, any> = {
    auth: Shield, domains: Globe, dns: Lock, hosting: Server, storage: HardDrive,
    terminal: Terminal, ai: Brain, payments: CreditCard, ssl: Lock, deploy: Zap, profile: Users,
  };

  const categoryColor: Record<string, string> = {
    auth: 'text-blue-500', domains: 'text-emerald-500', dns: 'text-purple-500', hosting: 'text-orange-500',
    storage: 'text-cyan-500', terminal: 'text-green-500', ai: 'text-violet-500', payments: 'text-yellow-500',
    ssl: 'text-pink-500', deploy: 'text-red-500', profile: 'text-slate-500',
  };

  const actionLabels: Record<string, string> = {
    login: 'Logged In', logout: 'Logged Out', register: 'Registered', email_verified: 'Email Verified',
    domain_search: 'Searched Domain', domain_register: 'Registered Domain', domain_delete: 'Deleted Domain',
    hosting_create: 'Created Hosting', file_upload: 'Uploaded File', file_delete: 'Deleted File',
    terminal_command: 'Terminal Command', ai_chat: 'AI Chat', ai_deploy: 'AI Deploy', ai_execute: 'AI Execute',
    payment_create: 'Created Payment', ssl_install: 'Installed SSL', deploy_start: 'Started Deploy',
    profile_update: 'Updated Profile', password_change: 'Changed Password',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Live User Activity Monitor
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            className={cn('text-xs', autoRefresh ? 'bg-emerald-600 hover:bg-emerald-700' : '')}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <><Wifi className="w-3 h-3 mr-1" /> Live</> : <><WifiOff className="w-3 h-3 mr-1" /> Paused</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={loadLiveData} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Online Users Bar */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-emerald-700">{onlineUsers.length} Online</span>
            </div>
            <span className="text-emerald-500">|</span>
            <div className="flex flex-wrap gap-1.5">
              {onlineUsers.map((u: any) => (
                <Badge key={u.id} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                  {u.firstName} {u.lastName}
                </Badge>
              ))}
              {onlineUsers.length === 0 && <span className="text-emerald-500 text-xs">No active users</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">Total Activities (24h)</div>
              <div className="text-xl font-bold">{stats.totalActivities}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">Online Now</div>
              <div className="text-xl font-bold text-emerald-600">{stats.onlineCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">Most Active Category</div>
              <div className="text-xl font-bold">{stats.categoryCounts?.[0]?.category || '-'}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">Top Action</div>
              <div className="text-xl font-bold">{stats.actionCounts?.[0]?.action || '-'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'auth', 'domains', 'hosting', 'terminal', 'ai', 'payments', 'ssl', 'storage', 'deploy'].map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            className={cn('text-[11px] h-7', filter === cat ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-200')}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activity recorded yet</p>
              </div>
            ) : (
              activities.map((a: any, i: number) => {
                const Icon = categoryIcon[a.category] || Activity;
                const colorClass = categoryColor[a.category] || 'text-slate-500';
                return (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors" style={{ animationDelay: `${i * 20}ms` }}>
                    <div className={cn('mt-0.5', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unknown User'}
                        </span>
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] px-1.5">
                          {a.user?.role || 'user'}
                        </Badge>
                        <span className="text-xs text-slate-400 ml-auto shrink-0">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {actionLabels[a.action] || a.action}
                        {a.details && (
                          <span className="text-slate-400 ml-1">
                            {(() => {
                              try {
                                const d = JSON.parse(a.details);
                                if (d.command) return `: ${d.command.substring(0, 60)}${d.command.length > 60 ? '...' : ''}`;
                                if (d.domain) return `: ${d.domain}`;
                                if (d.email) return `: ${d.email}`;
                                if (d.fileName) return `: ${d.fileName}`;
                                if (d.message) return `: ${d.message.substring(0, 50)}...`;
                                return '';
                              } catch { return ''; }
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {a.ipAddress && <span>IP: {a.ipAddress}</span>}
                        {a.isAdmin && <Badge className="ml-1 bg-red-100 text-red-600 text-[9px] px-1">Admin</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Users */}
      {stats?.mostActiveUsers?.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Active Users (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.mostActiveUsers.slice(0, 5).map((u: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-4 text-right">{i + 1}.</span>
                  <span className="font-medium">{u.user?.firstName} {u.user?.lastName}</span>
                  <span className="text-slate-400 text-xs">{u.user?.email}</span>
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-[10px]">{u.activityCount} actions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ USER DETAIL VIEW ============
function UserDetailView({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'manage'>('overview');

  // Manage account states
  const [resetPwMode, setResetPwMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [balanceMode, setBalanceMode] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct' | 'set'>('add');
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [storageLimit, setStorageLimit] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user-detail?userId=${userId}`);
      const data = await res.json();
      setUserDetail(data);
      setProfileForm({
        firstName: data.user?.firstName || '',
        lastName: data.user?.lastName || '',
        phone: data.user?.phone || '',
        company: data.user?.company || '',
        address: data.user?.address || '',
        city: data.user?.city || '',
        country: data.user?.country || '',
      });
      setStorageLimit(String(Math.round((data.user?.storageLimit || 5368709120) / 1024 / 1024 / 1024 * 100) / 100));
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadUserDetail(); }, [loadUserDetail]);

  const doAction = async (action: string, data: any = {}) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, ...data }),
      });
      const result = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: result.message || 'Action completed' });
        loadUserDetail();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Action failed' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Network error' });
    }
    setActionLoading(false);
    setTimeout(() => setActionMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!userDetail?.user) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>User not found</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const u = userDetail.user;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <h3 className="text-lg font-semibold text-slate-800">User Details</h3>
      </div>

      {actionMessage && (
        <div className={cn(
          'p-3 rounded-lg text-sm',
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <AlertCircle className="w-4 h-4 inline mr-1" />}
          {actionMessage.text}
        </div>
      )}

      {/* User Info Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl font-bold text-white">
              {u.firstName?.[0]}{u.lastName?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold">{u.firstName} {u.lastName}</h4>
                <Badge className={cn(statusColor(u.role), 'badge-transition')}>{u.role}</Badge>
                {u.emailVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Verified</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]"><AlertCircle className="w-3 h-3 mr-0.5" /> Unverified</Badge>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {u.email}</div>
                {u.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {u.phone}</div>}
                {u.company && <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {u.company}</div>}
                {u.city && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {u.city}{u.country ? `, ${u.country}` : ''}</div>}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                <span>Last Login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</span>
                {u.loginIp && <span>IP: {u.loginIp}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">৳{u.balance?.toFixed(0)}</div>
              <div className="text-xs text-slate-500">Balance</div>
              <div className="text-sm font-medium mt-1">{((u.storageUsed || 0) / 1024 / 1024).toFixed(1)}MB / {((u.storageLimit || 0) / 1024 / 1024 / 1024).toFixed(1)}GB</div>
              <div className="text-xs text-slate-500">Storage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Domains', value: u._count?.domains || 0, icon: Globe, color: 'text-emerald-500' },
          { label: 'Orders', value: u._count?.orders || 0, icon: Package, color: 'text-blue-500' },
          { label: 'Payments', value: u._count?.payments || 0, icon: CreditCard, color: 'text-yellow-500' },
          { label: 'Hosting', value: u._count?.hostingEnvs || 0, icon: Server, color: 'text-orange-500' },
          { label: 'Files', value: u._count?.files || 0, icon: HardDrive, color: 'text-cyan-500' },
          { label: 'Databases', value: u._count?.databases || 0, icon: Database, color: 'text-violet-500' },
          { label: 'AI Sessions', value: u._count?.agentSessions || 0, icon: Brain, color: 'text-pink-500' },
          { label: 'AI Memories', value: u._count?.agentMemories || 0, icon: Brain, color: 'text-purple-500' },
        ].map((s, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="bg-slate-100 border-slate-200">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity Log</TabsTrigger>
          <TabsTrigger value="manage" className="text-xs">Manage Account</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Domains */}
          {u.domains?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Globe className="w-4 h-4 text-emerald-500" /> Domains ({u.domains.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {u.domains.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm p-1.5 bg-slate-50 rounded">
                      <span className="font-medium">{d.name}</span>
                      <Badge className={cn(statusColor(d.status), 'text-[9px]')}>{d.status}</Badge>
                      {d.sslEnabled && <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">SSL</Badge>}
                      <span className="text-xs text-slate-400 ml-auto">Exp: {new Date(d.expiresAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {u.orders?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Package className="w-4 h-4 text-blue-500" /> Recent Orders ({u.orders.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {u.orders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center gap-2 text-sm p-1.5 bg-slate-50 rounded">
                      <span className="text-slate-600">{o.type}</span>
                      <span className="font-medium">৳{o.amount?.toFixed(0)}</span>
                      <Badge className={cn(statusColor(o.status), 'text-[9px]')}>{o.status}</Badge>
                      <Badge className={cn(statusColor(o.paymentStatus), 'text-[9px]')}>{o.paymentStatus}</Badge>
                      <span className="text-xs text-slate-400 ml-auto">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Payments */}
          {u.payments?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-yellow-500" /> Recent Payments ({u.payments.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {u.payments.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm p-1.5 bg-slate-50 rounded">
                      <span className="font-medium">৳{p.amount?.toFixed(0)}</span>
                      <Badge className={cn(statusColor(p.status), 'text-[9px]')}>{p.status}</Badge>
                      <span className="text-xs text-slate-400">{p.trxId || '-'}</span>
                      <span className="text-xs text-slate-400 ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Sessions */}
          {userDetail.agentSessions?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Brain className="w-4 h-4 text-violet-500" /> AI Sessions ({userDetail.agentSessions.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {userDetail.agentSessions.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm p-1.5 bg-slate-50 rounded">
                      <span className="font-medium">{s.title}</span>
                      <Badge className={cn(statusColor(s.status), 'text-[9px]')}>{s.status}</Badge>
                      <span className="text-xs text-slate-400">{s._count?.messages} msgs, {s._count?.tasks} tasks</span>
                      <span className="text-xs text-slate-400 ml-auto">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">User Activity Log</CardTitle>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 text-[11px] h-7" onClick={() => doAction('clear_activity')}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {userDetail.recentActivity?.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No activity recorded</div>
                ) : (
                  userDetail.recentActivity?.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                      <Badge className="bg-slate-100 text-slate-600 text-[9px] px-1.5">{a.category}</Badge>
                      <span className="font-medium text-slate-700">{a.action}</span>
                      {a.details && (
                        <span className="text-slate-400 truncate max-w-[200px]">
                          {(() => { try { const d = JSON.parse(a.details); return d.command ? d.command.substring(0, 50) : d.domain || d.email || d.message?.substring(0, 30) || ''; } catch { return ''; } })()}
                        </span>
                      )}
                      {a.ipAddress && <span className="text-slate-400">{a.ipAddress}</span>}
                      <span className="text-slate-400 ml-auto shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Account Tab */}
        <TabsContent value="manage" className="space-y-4 mt-4">
          {/* Reset Password */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Key className="w-4 h-4 text-emerald-600" /> Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              {resetPwMode ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-600">New Password (min 6 chars)</Label>
                    <Input className="mt-1 bg-white border-slate-300" type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading || newPassword.length < 6} onClick={() => { doAction('reset_password', { newPassword }); setResetPwMode(false); setNewPassword(''); }}>
                      {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Reset Password
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setResetPwMode(false); setNewPassword(''); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600" onClick={() => setResetPwMode(true)}>
                  <Key className="w-3 h-3 mr-1" /> Reset User Password
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Update Balance */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-yellow-600" /> Update Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {balanceMode ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">Current Balance: <span className="font-bold">৳{u.balance?.toFixed(0)}</span></div>
                  <div className="flex gap-2">
                    {(['add', 'deduct', 'set'] as const).map(act => (
                      <Button key={act} variant={balanceAction === act ? 'default' : 'outline'} size="sm" className={cn('text-xs', balanceAction === act ? 'bg-emerald-600' : '')} onClick={() => setBalanceAction(act)}>
                        {act === 'add' ? '+ Add' : act === 'deduct' ? '- Deduct' : '= Set'}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Amount (৳)</Label>
                    <Input className="mt-1 bg-white border-slate-300" type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="Enter amount" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading || !balanceAmount} onClick={() => { doAction('update_balance', { amount: parseFloat(balanceAmount), balanceAction }); setBalanceMode(false); setBalanceAmount(''); }}>
                      {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Update
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setBalanceMode(false); setBalanceAmount(''); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="border-yellow-200 text-yellow-600" onClick={() => setBalanceMode(true)}>
                  <DollarSign className="w-3 h-3 mr-1" /> Update Balance
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Verify Email */}
          {!u.emailVerified && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-amber-700"><Mail className="w-4 h-4" /> Email Not Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-600 mb-2">This user has not verified their email address. You can manually verify it.</p>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={actionLoading} onClick={() => doAction('verify_email')}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Verify Email Manually
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit Profile */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Edit3 className="w-4 h-4 text-blue-600" /> Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {editProfileMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">First Name</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} /></div>
                    <div><Label className="text-xs">Last Name</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} /></div>
                    <div><Label className="text-xs">Phone</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                    <div><Label className="text-xs">Company</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.company} onChange={e => setProfileForm({...profileForm, company: e.target.value})} /></div>
                    <div><Label className="text-xs">Address</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} /></div>
                    <div><Label className="text-xs">City</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} /></div>
                    <div><Label className="text-xs">Country</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={profileForm.country} onChange={e => setProfileForm({...profileForm, country: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={() => { doAction('update_profile', profileForm); setEditProfileMode(false); }}>
                      <Save className="w-3 h-3 mr-1" /> Save Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditProfileMode(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600" onClick={() => setEditProfileMode(true)}>
                  <Edit3 className="w-3 h-3 mr-1" /> Edit User Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Storage Limit */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-cyan-600" /> Storage Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-xs">Storage Limit (GB)</Label>
                  <Input className="mt-1 bg-white border-slate-300 w-32" type="number" value={storageLimit} onChange={e => setStorageLimit(e.target.value)} step="0.1" />
                </div>
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 mt-5" disabled={actionLoading} onClick={() => doAction('update_storage', { storageLimit: parseFloat(storageLimit) * 1024 * 1024 * 1024 })}>
                  <Save className="w-3 h-3 mr-1" /> Update
                </Button>
              </div>
              <div className="text-xs text-slate-500 mt-2">Used: {((u.storageUsed || 0) / 1024 / 1024).toFixed(1)}MB of {((u.storageLimit || 0) / 1024 / 1024 / 1024).toFixed(1)}GB</div>
            </CardContent>
          </Card>

          {/* Send Notification */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Send className="w-4 h-4 text-violet-600" /> Send Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div><Label className="text-xs">Title</Label><Input className="mt-1 bg-white border-slate-300 text-sm" value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} placeholder="Notification title" /></div>
                <div><Label className="text-xs">Message</Label><textarea className="mt-1 w-full p-2 border border-slate-300 rounded-md text-sm bg-white" rows={2} value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} placeholder="Notification message" /></div>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" disabled={actionLoading || !notificationTitle || !notificationMessage} onClick={() => { doAction('send_notification', { title: notificationTitle, message: notificationMessage, type: 'info' }); setNotificationTitle(''); setNotificationMessage(''); }}>
                  <Send className="w-3 h-3 mr-1" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Role (Super Admin only) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Shield className="w-4 h-4 text-red-600" /> Change Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Current role: <Badge className={cn(statusColor(u.role))}>{u.role}</Badge></span>
                <div className="flex gap-1.5 ml-2">
                  {['customer', 'admin', 'moderator'].filter(r => r !== u.role).map(r => (
                    <Button key={r} variant="outline" size="sm" className="text-[11px] h-7 border-slate-200" disabled={actionLoading} onClick={() => doAction('change_role', { role: r })}>
                      Set {r}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Requires super admin privileges</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ MAIN ADMIN VIEW ============
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  // If a user is selected, show UserDetailView
  if (selectedUserId) {
    return (
      <div className="animate-fade-in">
        <UserDetailView userId={selectedUserId} onBack={() => { setSelectedUserId(null); onRefresh(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100 border-slate-200 w-full overflow-x-auto flex-shrink-0">
          <TabsTrigger value="overview" className="transition-all text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="live_monitor" className="transition-all text-xs sm:text-sm">
            <Activity className="w-3.5 h-3.5 mr-1" /> Live Monitor
          </TabsTrigger>
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

        {/* Live Monitor Tab */}
        <TabsContent value="live_monitor" className="mt-4">
          <ActivityTab />
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
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Balance</th>
                        <th className="pb-3 font-medium">Last Login</th>
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
                              <div>
                                <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                                {u.emailVerified && <CheckCircle className="w-3 h-3 text-emerald-500 ml-1 inline" />}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 text-xs">{u.email}</td>
                          <td className="py-3">
                            <Badge className={cn(statusColor(u.role), 'badge-transition')}>{u.role}</Badge>
                          </td>
                          <td className="py-3 font-medium">৳{u.balance?.toFixed(0)}</td>
                          <td className="py-3 text-slate-500 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                          <td className="py-3">
                            {u.email === 'admin@fahadcloud.com' || u.adminRole === 'super_admin' ? (
                              <span className="text-slate-400 text-xs italic">Super Admin</span>
                            ) : (
                              <div className="flex gap-1.5">
                                {/* View Details Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] border-blue-200 text-blue-600 hover:bg-blue-50 px-2.5"
                                  onClick={() => setSelectedUserId(u.id)}
                                  title="View details & manage"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Details
                                </Button>
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
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrentPw(!showCurrentPw)}>
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
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNewPw(!showNewPw)}>
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
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 w-full sm:w-auto" onClick={handleChangePassword} disabled={passwordChanging}>
                {passwordChanging ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</> : <><Key className="w-4 h-4 mr-2" /> Change Password</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Security Info</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="text-sm">Suspicious Activities</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-sm">AI Memory Management</CardTitle></CardHeader>
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
