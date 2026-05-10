'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Power,
  ExternalLink,
  RefreshCw,
  Settings,
  HardDrive,
  Activity,
  Globe,
  Code,
  Terminal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatBytes, statusColor } from '@/lib/formatters';
import { apiClient } from '@/services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HostingEnv = {
  id: string;
  domain?: { name: string; sslEnabled: boolean };
  rootPath: string;
  serverType: string;
  planSlug: string;
  status: string;
  sslEnabled: boolean;
  storageUsed: number;
  storageLimit: number;
  bandwidthUsed: number;
  bandwidthLimit: number;
  lastDeployedAt: string;
  createdAt: string;
  deployLog?: string;
  framework?: string;
  nodeVersion?: string;
};

interface HostingViewProps {
  hostingEnvs: HostingEnv[];
  onNavigate: (view: string) => void;
  onRestartEnv: (envId: string) => void;
}

type HostingPlan = {
  slug: string;
  name: string;
  price: number;
  cpu: string;
  ram: string;
  storage: number;
  bandwidth: number;
  description?: string;
};

type Deployment = {
  id: string;
  envId: string;
  commit: string;
  branch: string;
  status: 'queued' | 'building' | 'deploying' | 'ready' | 'failed';
  message: string;
  createdAt: string;
  finishedAt?: string;
  log?: string;
};

type EnvVar = {
  id: string;
  key: string;
  value: string;
  createdAt: string;
};

type Domain = {
  id: string;
  name: string;
};

type ViewMode = 'list' | 'create' | 'detail';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stopped: 'bg-slate-50 text-slate-600 border-slate-200',
    deploying: 'bg-sky-50 text-sky-700 border-sky-200',
    building: 'bg-sky-50 text-sky-700 border-sky-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    queued: 'bg-amber-50 text-amber-700 border-amber-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const iconMap: Record<string, React.ReactNode> = {
    running: <CheckCircle className="h-3 w-3" />,
    active: <CheckCircle className="h-3 w-3" />,
    stopped: <XCircle className="h-3 w-3" />,
    deploying: <Loader2 className="h-3 w-3 animate-spin" />,
    building: <Loader2 className="h-3 w-3 animate-spin" />,
    error: <XCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    pending: <Loader2 className="h-3 w-3 animate-spin" />,
    queued: <Loader2 className="h-3 w-3 animate-spin" />,
    ready: <CheckCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium text-xs',
        colorMap[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
      )}
    >
      {iconMap[status] ?? <Server className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function DeployStatusBadge({ status }: { status: Deployment['status'] }) {
  const colorMap: Record<string, string> = {
    queued: 'bg-amber-50 text-amber-700 border-amber-200',
    building: 'bg-sky-50 text-sky-700 border-sky-200',
    deploying: 'bg-sky-50 text-sky-700 border-sky-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };

  const iconMap: Record<string, React.ReactNode> = {
    queued: <Loader2 className="h-3 w-3 animate-spin" />,
    building: <Loader2 className="h-3 w-3 animate-spin" />,
    deploying: <Loader2 className="h-3 w-3 animate-spin" />,
    ready: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium text-xs',
        colorMap[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
      )}
    >
      {iconMap[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function UsageBar({
  used,
  limit,
  label,
  color = 'emerald',
}: {
  used: number;
  limit: number;
  label: string;
  color?: 'emerald' | 'sky' | 'amber';
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const barColorMap = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
  };

  const barBgMap = {
    emerald: 'bg-emerald-100',
    sky: 'bg-sky-100',
    amber: 'bg-amber-100',
  };

  const textColorMap = {
    emerald: 'text-emerald-700',
    sky: 'text-sky-700',
    amber: 'text-amber-700',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={cn('text-xs font-semibold', textColorMap[color])}>
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', barBgMap[color])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{pct.toFixed(1)}% used</p>
    </div>
  );
}

function SslBadge({ sslEnabled }: { sslEnabled: boolean }) {
  if (sslEnabled) {
    return (
      <Badge
        variant="outline"
        className="gap-1 font-medium text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
      >
        <Lock className="h-3 w-3" />
        SSL
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 font-medium text-xs bg-amber-50 text-amber-700 border-amber-200"
    >
      <Lock className="h-3 w-3" />
      No SSL
    </Badge>
  );
}

function PlanBadge({ slug }: { slug: string }) {
  const planMap: Record<string, { label: string; className: string }> = {
    starter: {
      label: 'Starter',
      className: 'bg-slate-50 text-slate-700 border-slate-200',
    },
    pro: {
      label: 'Pro',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    business: {
      label: 'Business',
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    enterprise: {
      label: 'Enterprise',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  };

  const plan = planMap[slug] ?? {
    label: slug,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <Badge variant="outline" className={cn('gap-1 font-medium text-xs', plan.className)}>
      {plan.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Mock Data Generators (for demo / fallback)
// ---------------------------------------------------------------------------

function generateMockDeployments(envId: string): Deployment[] {
  const statuses: Deployment['status'][] = ['ready', 'ready', 'failed', 'ready', 'ready'];
  const branches = ['main', 'main', 'staging', 'main', 'feature/auth'];
  const commits = ['a1b2c3d', 'e4f5g6h', 'i7j8k9l', 'm0n1o2p', 'q3r4s5t'];
  const messages = [
    'Update homepage layout',
    'Fix payment processing bug',
    'Add staging config',
    'Performance optimizations',
    'Add auth middleware',
  ];

  return statuses.map((status, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (i * 6 + Math.floor(Math.random() * 4)));
    return {
      id: `deploy-${envId}-${i}`,
      envId,
      commit: commits[i],
      branch: branches[i],
      status,
      message: messages[i],
      createdAt: date.toISOString(),
      finishedAt: status === 'ready' || status === 'failed'
        ? new Date(date.getTime() + 120000).toISOString()
        : undefined,
      log:
        status === 'failed'
          ? `Cloning repository...\nInstalling dependencies...\nBuilding project...\n\nERROR: Build failed on line 42 of src/app.ts\nType error: Property 'user' does not exist on type '{}'.`
          : `Cloning repository...\nInstalling dependencies...\nBuilding project...\nOptimizing assets...\nDeploying to production...\n✓ Deployment successful!`,
    };
  });
}

function generateMockEnvVars(): EnvVar[] {
  return [
    { id: 'ev-1', key: 'NODE_ENV', value: 'production', createdAt: new Date().toISOString() },
    { id: 'ev-2', key: 'DATABASE_URL', value: '••••••••••••••••', createdAt: new Date().toISOString() },
    { id: 'ev-3', key: 'API_SECRET', value: '••••••••••••••••', createdAt: new Date().toISOString() },
    { id: 'ev-4', key: 'NEXT_PUBLIC_APP_URL', value: 'https://example.com', createdAt: new Date().toISOString() },
  ];
}

function generateMockLogs(): string[] {
  const now = new Date();
  return [
    `[${new Date(now.getTime() - 300000).toISOString()}] INFO  Server started on port 3000`,
    `[${new Date(now.getTime() - 240000).toISOString()}] INFO  Connected to database`,
    `[${new Date(now.getTime() - 180000).toISOString()}] INFO  Health check passed`,
    `[${new Date(now.getTime() - 120000).toISOString()}] WARN  High memory usage detected (78%)`,
    `[${new Date(now.getTime() - 60000).toISOString()}] INFO  Request served: GET /api/status 200 12ms`,
    `[${now.toISOString()}] INFO  Request served: GET /api/status 200 8ms`,
  ];
}

// ---------------------------------------------------------------------------
// Default Hosting Plans
// ---------------------------------------------------------------------------

const DEFAULT_PLANS: HostingPlan[] = [
  {
    slug: 'starter',
    name: 'Starter',
    price: 499,
    cpu: '1 vCPU',
    ram: '512 MB',
    storage: 5 * 1024 * 1024 * 1024,
    bandwidth: 50 * 1024 * 1024 * 1024,
    description: 'Perfect for personal projects and blogs',
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: 1499,
    cpu: '2 vCPU',
    ram: '2 GB',
    storage: 25 * 1024 * 1024 * 1024,
    bandwidth: 200 * 1024 * 1024 * 1024,
    description: 'Ideal for growing businesses',
  },
  {
    slug: 'business',
    name: 'Business',
    price: 3999,
    cpu: '4 vCPU',
    ram: '8 GB',
    storage: 100 * 1024 * 1024 * 1024,
    bandwidth: 1 * 1024 * 1024 * 1024 * 1024,
    description: 'For high-traffic applications',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    cpu: '8 vCPU',
    ram: '32 GB',
    storage: 500 * 1024 * 1024 * 1024,
    bandwidth: 5 * 1024 * 1024 * 1024 * 1024,
    description: 'Maximum performance and resources',
  },
];

const FRAMEWORKS = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'react', label: 'React (Vite)' },
  { value: 'nuxt', label: 'Nuxt.js' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'svelte', label: 'Svelte / SvelteKit' },
  { value: 'express', label: 'Express.js' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python (Django/Flask)' },
  { value: 'php', label: 'PHP (Laravel)' },
  { value: 'static', label: 'Static HTML' },
];

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (5% off)' },
  { value: 'semiannually', label: 'Semi-Annually (10% off)' },
  { value: 'annually', label: 'Annually (15% off)' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HostingView({
  hostingEnvs: propEnvs,
  onNavigate,
  onRestartEnv,
}: HostingViewProps) {
  // ---- Core State ----
  const [envs, setEnvs] = useState<HostingEnv[]>(propEnvs ?? []);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEnv, setSelectedEnv] = useState<HostingEnv | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  // ---- Create Hosting State ----
  const [plans, setPlans] = useState<HostingPlan[]>(DEFAULT_PLANS);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [createForm, setCreateForm] = useState({
    planSlug: '',
    domainId: '',
    domainName: '',
    framework: '',
    billingCycle: 'monthly',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ---- Deployments State ----
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  // ---- Environment Variables State ----
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [editingVar, setEditingVar] = useState<EnvVar | null>(null);
  const [editVarKey, setEditVarKey] = useState('');
  const [editVarValue, setEditVarValue] = useState('');
  const [savingVar, setSavingVar] = useState(false);
  const [deletingVarId, setDeletingVarId] = useState<string | null>(null);
  const [showEnvValues, setShowEnvValues] = useState<Record<string, boolean>>({});

  // ---- Logs State ----
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ---- Action State ----
  const [restarting, setRestarting] = useState<string | null>(null);
  const [stopping, setStopping] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  // ---- Feedback ----
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ---- Helpers ----
  const showFeedback = useCallback(
    (type: 'success' | 'error', message: string) => {
      setFeedback({ type, message });
      setTimeout(() => setFeedback(null), 4000);
    },
    []
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return formatDate(iso);
    } catch {
      return iso;
    }
  };

  const getPriceForCycle = (basePrice: number, cycle: string): number => {
    const discountMap: Record<string, number> = {
      monthly: 0,
      quarterly: 0.05,
      semiannually: 0.1,
      annually: 0.15,
    };
    const discount = discountMap[cycle] ?? 0;
    return Math.round(basePrice * (1 - discount));
  };

  // ---- Load Plans ----
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.getHostingPlans();
        if (Array.isArray(res) && res.length > 0) {
          setPlans(res);
        }
      } catch {
        // Use DEFAULT_PLANS
      }
    };
    fetchPlans();
  }, []);

  // ---- Load Domains ----
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await apiClient.getDomains();
        const domainList = Array.isArray(res) ? res : res?.data ?? [];
        setDomains(domainList);
      } catch {
        setDomains([]);
      }
    };
    fetchDomains();
  }, []);

  // ---- Sync prop envs ----
  useEffect(() => {
    if (propEnvs && propEnvs.length > 0) {
      setEnvs(propEnvs);
    }
  }, [propEnvs]);

  // ---- Load detail data when env selected ----
  const loadEnvDetail = useCallback((env: HostingEnv) => {
    setSelectedEnv(env);
    setDeployments(generateMockDeployments(env.id));
    setEnvVars(generateMockEnvVars());
    setLogs(generateMockLogs());
    setActiveDetailTab('overview');
    setSelectedDeployment(null);
  }, []);

  // ---- Create Hosting ----
  const handleCreateHosting = async () => {
    if (!createForm.planSlug) {
      setCreateError('Please select a hosting plan');
      return;
    }
    if (!createForm.domainName.trim()) {
      setCreateError('Please enter or select a domain');
      return;
    }
    if (!createForm.framework) {
      setCreateError('Please select a framework');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      await apiClient.createHostingSubscription({
        planSlug: createForm.planSlug,
        domain: createForm.domainName,
        framework: createForm.framework,
        billingCycle: createForm.billingCycle,
      });
      showFeedback('success', 'Hosting environment created successfully!');
      setCreateForm({
        planSlug: '',
        domainId: '',
        domainName: '',
        framework: '',
        billingCycle: 'monthly',
      });
      setViewMode('list');
    } catch (err: any) {
      setCreateError(err?.message ?? 'Failed to create hosting environment');
      showFeedback('error', err?.message ?? 'Failed to create hosting environment');
    } finally {
      setCreating(false);
    }
  };

  // ---- Environment Actions ----
  const handleRestart = async (envId: string) => {
    setRestarting(envId);
    try {
      await onRestartEnv(envId);
      showFeedback('success', 'Environment restarting…');
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to restart environment');
    } finally {
      setRestarting(null);
    }
  };

  const handleStop = async (envId: string) => {
    setStopping(envId);
    try {
      // Simulated stop action
      setEnvs((prev) =>
        prev.map((e) => (e.id === envId ? { ...e, status: 'stopped' } : e))
      );
      if (selectedEnv?.id === envId) {
        setSelectedEnv((prev) => (prev ? { ...prev, status: 'stopped' } : prev));
      }
      showFeedback('success', 'Environment stopped');
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to stop environment');
    } finally {
      setStopping(null);
    }
  };

  const handleStart = async (envId: string) => {
    setStarting(envId);
    try {
      setEnvs((prev) =>
        prev.map((e) => (e.id === envId ? { ...e, status: 'running' } : e))
      );
      if (selectedEnv?.id === envId) {
        setSelectedEnv((prev) => (prev ? { ...prev, status: 'running' } : prev));
      }
      showFeedback('success', 'Environment starting…');
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to start environment');
    } finally {
      setStarting(null);
    }
  };

  // ---- Deploy ----
  const handleDeploy = async () => {
    if (!selectedEnv) return;
    setDeploying(true);
    try {
      // Create a new deployment entry
      const newDeploy: Deployment = {
        id: `deploy-${selectedEnv.id}-${Date.now()}`,
        envId: selectedEnv.id,
        commit: Math.random().toString(36).substring(2, 9),
        branch: 'main',
        status: 'building',
        message: 'Manual deployment triggered',
        createdAt: new Date().toISOString(),
        log: 'Cloning repository...\nInstalling dependencies...\nBuilding project...',
      };
      setDeployments((prev) => [newDeploy, ...prev]);

      // Simulate deployment progress
      setTimeout(() => {
        setDeployments((prev) =>
          prev.map((d) =>
            d.id === newDeploy.id
              ? { ...d, status: 'deploying', log: d.log + '\nOptimizing assets...\nDeploying to production...' }
              : d
          )
        );
      }, 2000);

      setTimeout(() => {
        setDeployments((prev) =>
          prev.map((d) =>
            d.id === newDeploy.id
              ? {
                  ...d,
                  status: 'ready',
                  finishedAt: new Date().toISOString(),
                  log: d.log + '\n✓ Deployment successful!',
                }
              : d
          )
        );
        showFeedback('success', 'Deployment completed successfully!');
        setDeploying(false);
      }, 5000);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Deployment failed');
      setDeploying(false);
    }
  };

  // ---- Env Var Operations ----
  const handleAddEnvVar = async () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;
    setSavingVar(true);
    try {
      const newVar: EnvVar = {
        id: `ev-${Date.now()}`,
        key: newEnvKey.trim(),
        value: newEnvValue.trim(),
        createdAt: new Date().toISOString(),
      };
      setEnvVars((prev) => [...prev, newVar]);
      setNewEnvKey('');
      setNewEnvValue('');
      showFeedback('success', `Environment variable "${newVar.key}" added`);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to add variable');
    } finally {
      setSavingVar(false);
    }
  };

  const handleUpdateEnvVar = async () => {
    if (!editingVar || !editVarKey.trim()) return;
    setSavingVar(true);
    try {
      setEnvVars((prev) =>
        prev.map((v) =>
          v.id === editingVar.id ? { ...v, key: editVarKey.trim(), value: editVarValue.trim() } : v
        )
      );
      setEditingVar(null);
      setEditVarKey('');
      setEditVarValue('');
      showFeedback('success', 'Environment variable updated');
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to update variable');
    } finally {
      setSavingVar(false);
    }
  };

  const handleDeleteEnvVar = async (varId: string) => {
    setDeletingVarId(varId);
    try {
      setEnvVars((prev) => prev.filter((v) => v.id !== varId));
      showFeedback('success', 'Environment variable deleted');
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to delete variable');
    } finally {
      setDeletingVarId(null);
    }
  };

  // ---- Refresh Logs ----
  const handleRefreshLogs = () => {
    if (!selectedEnv) return;
    setLogsLoading(true);
    setTimeout(() => {
      setLogs(generateMockLogs());
      setLogsLoading(false);
    }, 800);
  };

  // ---- Navigation ----
  const openCreateView = () => {
    setCreateForm({ planSlug: '', domainId: '', domainName: '', framework: '', billingCycle: 'monthly' });
    setCreateError(null);
    setViewMode('create');
  };

  const openDetailView = (env: HostingEnv) => {
    loadEnvDetail(env);
    setViewMode('detail');
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedEnv(null);
    setSelectedDeployment(null);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* ---- Feedback Toast ---- */}
      {feedback && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewMode !== 'list' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={backToList}
              className="text-slate-400 hover:text-slate-600 -ml-2"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              Back
            </Button>
          )}
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {viewMode === 'list'
                ? 'Hosting Environments'
                : viewMode === 'create'
                ? 'Create New Hosting'
                : selectedEnv?.domain?.name ?? 'Environment Details'}
            </h1>
            <p className="text-sm text-slate-500">
              {viewMode === 'list'
                ? 'Manage your cloud hosting environments'
                : viewMode === 'create'
                ? 'Set up a new hosting environment'
                : `Plan: ${selectedEnv?.planSlug ?? '—'} • ${selectedEnv?.serverType ?? ''}`}
            </p>
          </div>
        </div>
        {viewMode === 'list' && (
          <Button
            onClick={openCreateView}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Hosting
          </Button>
        )}
      </div>

      {/* =================================================================
          VIEW: List
      ================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Empty State */}
          {envs.length === 0 && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Server className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  No Hosting Environments
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm">
                  Create your first hosting environment to deploy your applications on FahadCloud.
                </p>
                <Button
                  onClick={openCreateView}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hosting
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Environments Grid */}
          {envs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {envs.map((env) => (
                <Card
                  key={env.id}
                  className="border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                  onClick={() => openDetailView(env)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                            env.status === 'running'
                              ? 'bg-emerald-100 text-emerald-600'
                              : env.status === 'stopped'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-100 text-amber-600'
                          )}
                        >
                          <Server className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {env.domain?.name ?? env.rootPath}
                          </p>
                          <p className="text-xs text-slate-400">{env.serverType}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <StatusBadge status={env.status} />
                      <PlanBadge slug={env.planSlug} />
                      <SslBadge sslEnabled={env.sslEnabled} />
                    </div>

                    {/* Quick usage bars */}
                    <div className="space-y-2 mb-3">
                      <UsageBar
                        used={env.storageUsed}
                        limit={env.storageLimit}
                        label="Storage"
                        color="emerald"
                      />
                      <UsageBar
                        used={env.bandwidthUsed}
                        limit={env.bandwidthLimit}
                        label="Bandwidth"
                        color="sky"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span>
                        {env.framework && (
                          <span className="inline-flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            {env.framework}
                          </span>
                        )}
                        {env.nodeVersion && (
                          <span className="ml-2">Node {env.nodeVersion}</span>
                        )}
                      </span>
                      <span>
                        Deployed {formatRelativeTime(env.lastDeployedAt)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      {env.status === 'running' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestart(env.id);
                            }}
                            disabled={restarting === env.id}
                            className="h-7 text-xs border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200"
                          >
                            {restarting === env.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Restart
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStop(env.id);
                            }}
                            disabled={stopping === env.id}
                            className="h-7 text-xs border-slate-200 text-slate-600 hover:text-red-700 hover:border-red-200"
                          >
                            {stopping === env.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Power className="h-3 w-3 mr-1" />
                            )}
                            Stop
                          </Button>
                        </>
                      )}
                      {env.status === 'stopped' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStart(env.id);
                          }}
                          disabled={starting === env.id}
                          className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          {starting === env.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Power className="h-3 w-3 mr-1" />
                          )}
                          Start
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailView(env);
                        }}
                        className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          VIEW: Create New Hosting
      ================================================================= */}
      {viewMode === 'create' && (
        <div className="space-y-6 max-w-3xl">
          {/* Plan Selection */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-emerald-500" />
                Select a Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((plan) => {
                  const isSelected = createForm.planSlug === plan.slug;
                  return (
                    <button
                      key={plan.slug}
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({ ...prev, planSlug: plan.slug }))
                      }
                      className={cn(
                        'relative text-left p-4 rounded-xl border-2 transition-all',
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                        <div className="text-right">
                          <span className="text-lg font-bold text-emerald-600">
                            ৳{plan.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">/mo</span>
                        </div>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-emerald-500" />
                          {plan.cpu}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="h-3 w-3 text-emerald-500" />
                          {plan.ram}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Server className="h-3 w-3 text-emerald-500" />
                          {formatBytes(plan.storage)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-emerald-500" />
                          {formatBytes(plan.bandwidth)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Domain & Framework */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                Domain &amp; Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Domain selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Domain</Label>
                {domains.length > 0 ? (
                  <Select
                    value={createForm.domainId}
                    onValueChange={(val) => {
                      const domain = domains.find((d) => d.id === val);
                      setCreateForm((prev) => ({
                        ...prev,
                        domainId: val,
                        domainName: domain?.name ?? '',
                      }));
                    }}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="e.g. app.example.com"
                      value={createForm.domainName}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, domainName: e.target.value }))
                      }
                      className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <p className="text-xs text-slate-400">
                      Enter a domain or subdomain. You can also{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('domains')}
                        className="text-emerald-600 hover:underline font-medium"
                      >
                        register a new domain
                      </button>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Framework */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Framework / Runtime</Label>
                <Select
                  value={createForm.framework}
                  onValueChange={(val) =>
                    setCreateForm((prev) => ({ ...prev, framework: val }))
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((fw) => (
                      <SelectItem key={fw.value} value={fw.value}>
                        {fw.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-500" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Billing Cycle</Label>
                <Select
                  value={createForm.billingCycle}
                  onValueChange={(val) =>
                    setCreateForm((prev) => ({ ...prev, billingCycle: val }))
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-emerald-400 focus:ring-emerald-400">
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((cycle) => (
                      <SelectItem key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Summary */}
              {createForm.planSlug && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Order Summary</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plan</span>
                      <span className="font-medium text-slate-900">
                        {plans.find((p) => p.slug === createForm.planSlug)?.name ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Billing</span>
                      <span className="font-medium text-slate-900 capitalize">
                        {createForm.billingCycle}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ৳
                        {getPriceForCycle(
                          plans.find((p) => p.slug === createForm.planSlug)?.price ?? 0,
                          createForm.billingCycle
                        ).toLocaleString()}
                        <span className="text-xs font-normal text-slate-400">
                          /{createForm.billingCycle === 'monthly' ? 'mo' : createForm.billingCycle.replace('ly', '')}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {createError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={backToList}
              className="border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateHosting}
              disabled={creating || !createForm.planSlug || !createForm.framework}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-sm"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hosting
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* =================================================================
          VIEW: Detail
      ================================================================= */}
      {viewMode === 'detail' && selectedEnv && (
        <div className="space-y-6">
          {/* ---- Header Banner ---- */}
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <Server className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedEnv.domain?.name ?? selectedEnv.rootPath}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                        {selectedEnv.status}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                        {selectedEnv.planSlug}
                      </Badge>
                      {selectedEnv.framework && (
                        <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                          {selectedEnv.framework}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEnv.status === 'running' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestart(selectedEnv.id)}
                        disabled={restarting === selectedEnv.id}
                        className="text-white/80 hover:text-white hover:bg-white/10 h-8"
                      >
                        {restarting === selectedEnv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStop(selectedEnv.id)}
                        disabled={stopping === selectedEnv.id}
                        className="text-white/80 hover:text-white hover:bg-white/10 h-8"
                      >
                        {stopping === selectedEnv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {selectedEnv.status === 'stopped' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStart(selectedEnv.id)}
                      disabled={starting === selectedEnv.id}
                      className="text-white/80 hover:text-white hover:bg-white/10 h-8"
                    >
                      {starting === selectedEnv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Domain</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {selectedEnv.domain?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Plan</p>
                  <PlanBadge slug={selectedEnv.planSlug} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">SSL</p>
                  <SslBadge sslEnabled={selectedEnv.sslEnabled} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Deployed</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatRelativeTime(selectedEnv.lastDeployedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---- Detail Tabs ---- */}
          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg w-full sm:w-auto flex flex-wrap">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="deployments"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Code className="h-3.5 w-3.5 mr-1.5" />
                Deployments
              </TabsTrigger>
              <TabsTrigger
                value="env-vars"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                Env Vars
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Logs
              </TabsTrigger>
            </TabsList>

            {/* ================================================================
                TAB: Overview
            ================================================================ */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Resource Usage */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-emerald-500" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UsageBar
                    used={selectedEnv.storageUsed}
                    limit={selectedEnv.storageLimit}
                    label="Storage"
                    color="emerald"
                  />
                  <UsageBar
                    used={selectedEnv.bandwidthUsed}
                    limit={selectedEnv.bandwidthLimit}
                    label="Bandwidth (this month)"
                    color="sky"
                  />
                </CardContent>
              </Card>

              {/* Environment Info */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-500" />
                    Environment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <InfoRow label="Domain" value={selectedEnv.domain?.name ?? '—'} />
                    <InfoRow label="Root Path" value={selectedEnv.rootPath} />
                    <InfoRow label="Server Type" value={selectedEnv.serverType} />
                    <InfoRow label="Plan" value={selectedEnv.planSlug} />
                    <InfoRow label="Framework" value={selectedEnv.framework ?? '—'} />
                    <InfoRow
                      label="Node Version"
                      value={selectedEnv.nodeVersion ?? '—'}
                    />
                    <InfoRow label="SSL Enabled" value={selectedEnv.sslEnabled ? 'Yes' : 'No'} />
                    <InfoRow label="Status" value={selectedEnv.status} />
                    <InfoRow
                      label="Created"
                      value={formatDate(selectedEnv.createdAt)}
                    />
                    <InfoRow
                      label="Last Deployed"
                      value={formatDate(selectedEnv.lastDeployedAt)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Deploy */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Code className="h-4 w-4 text-emerald-500" />
                      Quick Deploy
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 mb-4">
                    Trigger a new deployment from the latest commit on your main branch.
                  </p>
                  <Button
                    onClick={handleDeploy}
                    disabled={deploying || selectedEnv.status !== 'running'}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Deploy Now
                      </>
                    )}
                  </Button>
                  {selectedEnv.status !== 'running' && (
                    <p className="text-xs text-amber-600 mt-2">
                      Environment must be running to deploy
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ================================================================
                TAB: Deployments
            ================================================================ */}
            <TabsContent value="deployments" className="mt-6 space-y-4">
              {/* Deploy Action */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Deployment History ({deployments.length})
                </h3>
                <Button
                  size="sm"
                  onClick={handleDeploy}
                  disabled={deploying || selectedEnv.status !== 'running'}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                >
                  {deploying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Deploy
                </Button>
              </div>

              {/* Deployment List */}
              {deployments.length === 0 && (
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <Code className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No deployments yet</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {deployments.map((deploy) => (
                  <Card
                    key={deploy.id}
                    className={cn(
                      'border shadow-sm transition-all',
                      selectedDeployment?.id === deploy.id
                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <CardContent className="p-4">
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() =>
                          setSelectedDeployment(
                            selectedDeployment?.id === deploy.id ? null : deploy
                          )
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                              deploy.status === 'ready'
                                ? 'bg-emerald-100 text-emerald-600'
                                : deploy.status === 'failed'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-sky-100 text-sky-600'
                            )}
                          >
                            {deploy.status === 'ready' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : deploy.status === 'failed' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                {deploy.commit}
                              </code>
                              <span className="text-xs text-slate-400">on</span>
                              <span className="text-xs font-medium text-slate-600">
                                {deploy.branch}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{deploy.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatRelativeTime(deploy.createdAt)}
                              {deploy.finishedAt && (
                                <span>
                                  {' '}
                                  &middot; Took{' '}
                                  {Math.round(
                                    (new Date(deploy.finishedAt).getTime() -
                                      new Date(deploy.createdAt).getTime()) /
                                      1000
                                  )}
                                  s
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DeployStatusBadge status={deploy.status} />
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-transform',
                              selectedDeployment?.id === deploy.id ? 'rotate-90 text-emerald-500' : 'text-slate-300'
                            )}
                          />
                        </div>
                      </div>

                      {/* Deployment Log (expanded) */}
                      {selectedDeployment?.id === deploy.id && deploy.log && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Terminal className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">
                              Build Log
                            </span>
                          </div>
                          <pre className="bg-slate-900 text-emerald-400 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                            {deploy.log}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ================================================================
                TAB: Environment Variables
            ================================================================ */}
            <TabsContent value="env-vars" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Environment Variables ({envVars.length})
                </h3>
              </div>

              {/* Add New Variable */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-500" />
                    Add Variable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1">Key</Label>
                      <Input
                        placeholder="e.g. API_KEY"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                        className="h-9 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 font-mono text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1">Value</Label>
                      <Input
                        placeholder="e.g. sk_live_..."
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                        className="h-9 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 font-mono text-sm"
                        type="password"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddEnvVar}
                        disabled={!newEnvKey.trim() || !newEnvValue.trim() || savingVar}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm h-9"
                      >
                        {savingVar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variable List */}
              {envVars.length === 0 && (
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <Terminal className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No environment variables configured</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {envVars.map((envVar) => (
                  <Card
                    key={envVar.id}
                    className="border border-slate-200 shadow-sm"
                  >
                    <CardContent className="p-4">
                      {editingVar?.id === envVar.id ? (
                        /* Editing Mode */
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <Label className="text-xs text-slate-500 mb-1">Key</Label>
                              <Input
                                value={editVarKey}
                                onChange={(e) => setEditVarKey(e.target.value)}
                                className="h-9 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 font-mono text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-slate-500 mb-1">Value</Label>
                              <Input
                                value={editVarValue}
                                onChange={(e) => setEditVarValue(e.target.value)}
                                className="h-9 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleUpdateEnvVar}
                              disabled={savingVar}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm h-8 text-xs"
                            >
                              {savingVar ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingVar(null);
                                setEditVarKey('');
                                setEditVarValue('');
                              }}
                              className="h-8 text-xs text-slate-500"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-semibold text-slate-900 font-mono">
                                {envVar.key}
                              </code>
                              {envVar.key.includes('SECRET') ||
                              envVar.key.includes('KEY') ||
                              envVar.key.includes('PASSWORD') ||
                              envVar.key.includes('TOKEN') ? (
                                <Lock className="h-3 w-3 text-amber-500" />
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                              {showEnvValues[envVar.id]
                                ? envVar.value
                                : '••••••••••••••••'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setShowEnvValues((prev) => ({
                                  ...prev,
                                  [envVar.id]: !prev[envVar.id],
                                }))
                              }
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                            >
                              {showEnvValues[envVar.id] ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <ExternalLink className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingVar(envVar);
                                setEditVarKey(envVar.key);
                                setEditVarValue(envVar.value);
                              }}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEnvVar(envVar.id)}
                              disabled={deletingVarId === envVar.id}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            >
                              {deletingVarId === envVar.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Sensitive Variables</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Secrets like API keys, tokens, and passwords are encrypted at rest. Values are
                    masked by default. Changing environment variables requires a redeployment to take
                    effect.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ================================================================
                TAB: Logs
            ================================================================ */}
            <TabsContent value="logs" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Runtime Logs
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshLogs}
                  disabled={logsLoading}
                  className="border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 h-8"
                >
                  {logsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Refresh
                </Button>
              </div>

              <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400 ml-2 font-mono">
                    {selectedEnv.domain?.name ?? selectedEnv.rootPath} — logs
                  </span>
                </div>
                <div className="bg-slate-900 p-4 max-h-96 overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mr-3" />
                      <span className="text-slate-400 text-sm">Loading logs…</span>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-slate-500 text-sm">No logs available</span>
                    </div>
                  ) : (
                    <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {logs.map((line, i) => {
                        const isError = line.includes('ERROR');
                        const isWarn = line.includes('WARN');
                        return (
                          <div
                            key={i}
                            className={cn(
                              'py-0.5',
                              isError
                                ? 'text-red-400'
                                : isWarn
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            )}
                          >
                            {line}
                          </div>
                        );
                      })}
                    </pre>
                  )}
                </div>
              </Card>

              {/* Deploy Log (if available from env) */}
              {selectedEnv.deployLog && (
                <Card className="border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Code className="h-4 w-4 text-emerald-500" />
                      Last Deploy Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-emerald-400 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                      {selectedEnv.deployLog}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility Sub-component
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right truncate ml-4 max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
