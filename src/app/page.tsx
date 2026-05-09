'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Cloud, Menu, X, Bell, LogOut, LayoutDashboard, Globe, Brain, Radar, Rocket, Monitor, Server, Lock, HardDrive, ShoppingCart, Terminal, UserCircle, Settings, Shield, Zap, TrendingUp, CreditCard, Database, AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { useDomains } from '@/hooks/use-domains'
import { useAgent } from '@/hooks/use-agent'
import { useMonitoring } from '@/hooks/use-monitoring'
import { useAdmin } from '@/hooks/use-admin'
import { apiClient } from '@/services/api'
import type { User, Domain, HostingEnv, OrderItem } from '@/types'

import LandingPage from '@/features/landing/LandingPage'
import AiLanding from '@/features/landing/AiLanding'
import DashboardView from '@/features/dashboard/DashboardView'
import DomainsView from '@/features/domains/DomainsView'
import AgentChatView from '@/features/agent/AgentChatView'
import AgentCloudIntel from '@/features/agent/AgentCloudIntel'
import DeployView from '@/features/deploy/DeployView'
import MonitoringView from '@/features/monitoring/MonitoringView'
import HostingView from '@/features/hosting/HostingView'
import DnsManager from '@/features/domains/DnsManager'
import SslView from '@/features/ssl/SslView'
import StorageView from '@/features/storage/StorageView'
import PaymentsView from '@/features/payments/PaymentsView'
import TerminalView from '@/features/terminal/TerminalView'
import ProfileView from '@/features/profile/ProfileView'
import AdminView from '@/features/admin/AdminView'
import SuperAdminView from '@/features/admin/SuperAdminView'

const agentIconMap: Record<string, any> = { Rocket, Shield, Monitor, AlertTriangle, Server, Database, Zap, RotateCcw, TrendingUp, Globe, CreditCard, Brain }

function getNavItems(user: User | null) {
  if (!user) return []
  
  // ADMIN gets COMPLETELY different navigation - full project control
  if (user.role === 'admin') {
    return [
      { id: 'admin', label: 'Admin Panel', icon: Shield },
      { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { id: 'domains', label: 'My Domains', icon: Globe },
      { id: 'ai_agent', label: 'AI Agent', icon: Brain, badge: '14' },
      { id: 'hosting', label: 'My Hosting', icon: Server },
      { id: 'ai_terminal', label: 'Terminal', icon: Terminal },
      { id: 'profile', label: 'Profile', icon: UserCircle },
    ]
  }
  
  // REGULAR USER - only their own stuff
  return [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'ai_agent', label: 'AI Agent', icon: Brain, badge: '14 Agents' },
    { id: 'ai_cloud', label: 'Cloud Intel', icon: Radar },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'monitoring', label: 'Monitor', icon: Monitor },
    { id: 'hosting', label: 'Hosting', icon: Server },
    { id: 'dns', label: 'DNS', icon: Lock },
    { id: 'ssl', label: 'SSL', icon: Lock },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'payments', label: 'Orders', icon: ShoppingCart },
    { id: 'ai_terminal', label: 'Terminal', icon: Terminal },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ]
}

function FahadCloudAppInner() {
  const { user, loading: authLoading, login, register, logout, checkAuth, refreshUser } = useAuth()
  const domainHook = useDomains()
  const agentHook = useAgent()
  const monitoringHook = useMonitoring()
  const adminHook = useAdmin()

  // Navigation
  const [currentView, setCurrentView] = useState('landing')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [hostingEnvs, setHostingEnvs] = useState<HostingEnv[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // Domain search string (local, separate from hook's search function)
  const [searchDomainStr, setSearchDomainStr] = useState('')

  // Cloud Intel (not fully in hook)
  const [systemOverview, setSystemOverview] = useState<any>(null)
  const [securityStatus, setSecurityStatus] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])

  // Auth dialog state
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showRegVerify, setShowRegVerify] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPass, setRegPass] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminOtpSent, setAdminOtpSent] = useState(false)
  const [adminOtp, setAdminOtp] = useState('')
  const [adminOtpLoading, setAdminOtpLoading] = useState(false)
  const [adminVerifyLoading, setAdminVerifyLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [regOtp, setRegOtp] = useState('')
  const [regOtpLoading, setRegOtpLoading] = useState(false)
  const [regVerifyLoading, setRegVerifyLoading] = useState(false)
  const [regPendingEmail, setRegPendingEmail] = useState('')

  // Deploy
  const [deployDomain, setDeployDomain] = useState('')
  const [deployFramework, setDeployFramework] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployLog, setDeployLog] = useState('')

  // Terminal
  const [termHistory, setTermHistory] = useState<{ cmd: string; output: string; exitCode: number }[]>([])
  const [termInput, setTermInput] = useState('')
  const [termRunning, setTermRunning] = useState(false)

  // DNS
  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsRecords, setDnsRecords] = useState<any[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)
  const [newDnsRecord, setNewDnsRecord] = useState({ type: 'A', name: '', value: '', ttl: 3600 })

  // Payment
  const [paymentOrder, setPaymentOrder] = useState<any>(null)
  const [bkashNumber, setBkashNumber] = useState('')
  const [bkashTrxId, setBkashTrxId] = useState('')
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Storage
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [storageLoading, setStorageLoading] = useState(false)

  // Profile
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', company: '', address: '', city: '', country: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [actionVerifyStep, setActionVerifyStep] = useState<'idle' | 'request' | 'verify'>('idle')
  const [actionVerifyOtp, setActionVerifyOtp] = useState('')
  const [actionVerifyLoading, setActionVerifyLoading] = useState(false)
  const [actionVerifyAction, setActionVerifyAction] = useState('')
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)

  // Forgot Password / Reset Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // ============ DATA LOADERS ============
  const loadDashboard = useCallback(async () => {
    if (!user) return
    setDashboardLoading(true)
    try {
      const [d, h, p] = await Promise.all([apiClient.getDomains(), apiClient.request('/api/hosting'), apiClient.getPricing()])
      domainHook.setDomains(Array.isArray(d.domains) ? d.domains : Array.isArray(d) ? d : [])
      setHostingEnvs(Array.isArray(h.environments) ? h.environments : Array.isArray(h) ? h : [])
    } catch { /* handled */ }
    setDashboardLoading(false)
  }, [user])

  const loadDnsRecords = useCallback(async (domainName: string) => {
    if (!domainName) return
    setDnsLoading(true)
    try {
      const domainObj = domainHook.domains.find((d: Domain) => d.name === domainName)
      const data = await apiClient.getDnsRecords(domainObj?.id || '', domainName)
      setDnsRecords(data.records || data.dnsRecords || [])
    } catch { setDnsRecords([]) }
    setDnsLoading(false)
  }, [domainHook.domains])

  const loadStorageFiles = useCallback(async () => {
    setStorageLoading(true)
    try { const data = await apiClient.getFiles(); setFiles(data.files || data || []) } catch { setFiles([]) }
    setStorageLoading(false)
  }, [])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try { const data = await apiClient.getOrders(); setOrders(data.orders || data || []) } catch { setOrders([]) }
    setOrdersLoading(false)
  }, [])

  const loadAgentCloudIntel = useCallback(async () => {
    try { const data = await apiClient.getAgentSystem(); setSystemOverview(data.overview) } catch {}
    try { const secData = await apiClient.getAgentSecurity(); setSecurityStatus(secData.status) } catch {}
    try { const learnData = await apiClient.getAgentLearning(); setPredictions(learnData.predictions || []) } catch {}
  }, [])

  // ============ EFFECTS ============
  useEffect(() => { if (user) { loadDashboard(); if (user.role === 'admin' && currentView === 'dashboard') setCurrentView('admin'); } }, [user, loadDashboard])

  useEffect(() => {
    if (!user) return
    if (currentView === 'monitoring' || currentView === 'ai_terminal') monitoringHook.loadMonitoring()
    if (currentView === 'admin') adminHook.loadAdminData()
    if (currentView === 'ai_agent') { agentHook.loadHistory(); agentHook.loadSystem() }
    if (currentView === 'ai_cloud') { agentHook.loadSystem(); loadAgentCloudIntel() }
    if (currentView === 'storage') loadStorageFiles()
    if (currentView === 'payments') loadOrders()
    if (currentView === 'profile') setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', company: user.company || '', address: user.address || '', city: user.city || '', country: user.country || '' })
    if (currentView === 'dns' && dnsDomain) loadDnsRecords(dnsDomain)
  }, [user, currentView])

  useEffect(() => { if (dnsDomain) loadDnsRecords(dnsDomain); else setDnsRecords([]) }, [dnsDomain, loadDnsRecords])

  // ============ AUTH HANDLERS ============
  const doLogin = async () => {
    setAuthError('')
    try { await login(loginEmail, loginPass); setShowLogin(false); setCurrentView('dashboard'); toast.success('Welcome back!') }
    catch (e: any) {
      if (e.message?.includes('verify your email')) { setRegPendingEmail(loginEmail); setShowRegVerify(true); setShowLogin(false); toast.info('Please verify your email first') }
      else setAuthError(e.message)
    }
  }

  const doRegister = async () => {
    setAuthError('')
    try {
      const names = regName.split(' ')
      await register({ firstName: names[0] || '', lastName: names.slice(1).join(' ') || '', email: regEmail, phone: regPhone, password: regPass })
      setShowRegister(false); setRegPendingEmail(regEmail.toLowerCase()); setShowRegVerify(true); toast.success('Verification code sent to your email!')
    } catch (e: any) { setAuthError(e.message) }
  }

  const doVerifyRegOtp = async () => {
    setAuthError(''); if (!regOtp.trim()) { setAuthError('Please enter the verification code'); return }
    setRegVerifyLoading(true)
    try { await apiClient.verifyEmail(regPendingEmail, regOtp.trim()); setShowRegVerify(false); setRegOtp(''); toast.success('Email verified!'); setLoginEmail(regPendingEmail); setShowLogin(true); setRegPendingEmail('') }
    catch (e: any) { setAuthError(e.message) }
    setRegVerifyLoading(false)
  }

  const doResendVerification = async () => {
    setAuthError(''); setRegOtpLoading(true)
    try { await apiClient.resendVerification(regPendingEmail); toast.success('Verification code sent!') } catch (e: any) { setAuthError(e.message) }
    setRegOtpLoading(false)
  }

  const doAdminRequestOtp = async () => {
    setAdminError(''); if (!adminEmail.trim()) { setAdminError('Please enter your email'); return }
    setAdminOtpLoading(true)
    try { await apiClient.adminLoginRequest(adminEmail.trim()); setAdminOtpSent(true); toast.success('Verification code sent!') } catch (e: any) { setAdminError(e.message) }
    setAdminOtpLoading(false)
  }

  const doAdminVerifyOtp = async () => {
    setAdminError(''); if (!adminOtp.trim()) { setAdminError('Please enter the verification code'); return }
    setAdminVerifyLoading(true)
    try { await apiClient.adminLoginVerify(adminEmail.trim(), adminOtp.trim()); setShowAdminLogin(false); setAdminOtpSent(false); setAdminOtp(''); setAdminEmail(''); setAdminError(''); await checkAuth(); setCurrentView('admin'); toast.success('Admin login successful!') }
    catch (e: any) { setAdminError(e.message) }
    setAdminVerifyLoading(false)
  }


  const doAdminPasswordLogin = async (email: string, password: string) => {
    setAdminError('')
    try {
      await login(email, password)
      setShowAdminLogin(false)
      setAdminOtpSent(false)
      setAdminOtp('')
      setAdminEmail('')
      setAdminError('')
      await checkAuth()
      setCurrentView('dashboard')
      toast.success('Admin login successful!')
    } catch (e: any) {
      setAdminError(e.message || 'Invalid credentials')
    }
  }

  const doLogout = () => { logout(); setCurrentView('landing'); agentHook.startNewChat(); toast.success('Logged out') }

  // ============ ACTION HANDLERS ============
  const doDomainSearch = () => domainHook.searchDomain(searchDomainStr)

  const doRegisterDomain = async (domain: string, price: number) => {
    try { const orderData = await domainHook.registerDomain(domain, price); setPaymentOrder({ id: orderData.id, domain, price, type: 'domain_registration' }); setCurrentView('payments') }
    catch (e: any) { toast.error(e.message || 'Failed to create order') }
  }

  const startDeploy = async () => {
    if (!deployDomain || !deployFramework) { toast.error('Select domain and framework'); return }
    setDeploying(true); setDeployLog('Initializing deployment...\n')
    try { const data = await apiClient.deployAgent({ domainName: deployDomain, framework: deployFramework, sessionId: agentHook.sessionId }); setDeployLog(p => p + `Task: ${data.taskId}\nStatus: Running...\n`); toast.success('Deployment started!'); agentHook.loadHistory() }
    catch (e: any) { setDeployLog(p => p + `Error: ${e.message}\n`); toast.error(e.message) }
    setDeploying(false)
  }

  const executeCommand = async () => {
    if (!termInput.trim() || termRunning) return
    const cmd = termInput.trim(); setTermInput(''); setTermRunning(true)
    try { const data = await apiClient.executeCommand(cmd, agentHook.sessionId); setTermHistory(p => [...p, { cmd, output: data.output || data.error || 'No output', exitCode: data.exitCode }]) }
    catch (e: any) { setTermHistory(p => [...p, { cmd, output: e.message, exitCode: 1 }]) }
    setTermRunning(false)
  }

  const saveProfile = async () => {
    setProfileSaving(true)
    try { await apiClient.updateProfile(profileForm); await refreshUser(); setProfileEditing(false); toast.success('Profile updated!') } catch (e: any) { toast.error(e.message) }
    setProfileSaving(false)
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (passwordForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (actionVerifyStep === 'idle') {
      setActionVerifyAction('password_change'); setActionVerifyLoading(true)
      try { await apiClient.requestActionVerification('password_change'); setActionVerifyStep('verify'); toast.success('Verification code sent!') } catch (e: any) { toast.error(e.message) }
      setActionVerifyLoading(false); return
    }
    if (actionVerifyStep === 'verify') {
      if (!actionVerifyOtp.trim()) { toast.error('Enter the verification code'); return }
      setActionVerifyLoading(true)
      try { await apiClient.verifyAction('password_change', actionVerifyOtp.trim()); await apiClient.updateProfile({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }); setShowChangePassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setActionVerifyStep('idle'); setActionVerifyOtp(''); toast.success('Password changed!') }
      catch (e: any) { toast.error(e.message) }
      setActionVerifyLoading(false)
    }
  }

  const requestActionVerify = async (action: string) => {
    setActionVerifyAction(action); setActionVerifyLoading(true)
    try { await apiClient.requestActionVerification(action); setActionVerifyStep('verify'); toast.success('Verification code sent!') } catch (e: any) { toast.error(e.message) }
    setActionVerifyLoading(false)
  }

  const verifyAndDeleteAccount = async () => {
    if (!actionVerifyOtp.trim()) { toast.error('Enter the verification code'); return }
    setDeleteAccountLoading(true)
    try { await apiClient.verifyAction('account_delete', actionVerifyOtp.trim()); await apiClient.deleteAccount(); logout(); setCurrentView('landing'); setShowDeleteAccount(false); setActionVerifyStep('idle'); setActionVerifyOtp(''); toast.success('Account deleted') }
    catch (e: any) { toast.error(e.message) }
    setDeleteAccountLoading(false)
  }

  const restartHostingEnv = async (envId: string) => { try { await apiClient.request('/api/hosting', { method: 'POST', body: JSON.stringify({ action: 'restart', envId }) }); toast.success('Restarting...') } catch (e: any) { toast.error(e.message) } }
  const addDnsRecord = async () => { try { await apiClient.addDnsRecord({ domain: dnsDomain, ...newDnsRecord }); toast.success('DNS record added'); loadDnsRecords(dnsDomain); setNewDnsRecord({ type: 'A', name: '', value: '', ttl: 3600 }) } catch (e: any) { toast.error(e.message) } }
  const uploadFiles = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.onchange = async (e: any) => { setUploading(true); const fd = new FormData(); for (const f of e.target.files) fd.append('files', f); try { await fetch('/api/storage', { method: 'POST', body: fd }); toast.success('Files uploaded'); loadStorageFiles() } catch { toast.error('Upload failed') }; setUploading(false) }; inp.click() }
  const submitPayment = async () => { setPaymentProcessing(true); try { await apiClient.createPayment({ orderId: paymentOrder.id, bKashNumber: bkashNumber, bKashTrxId: bkashTrxId }); toast.success('Payment submitted!'); setPaymentOrder(null); setBkashNumber(''); setBkashTrxId(''); loadOrders() } catch (e: any) { toast.error(e.message) }; setPaymentProcessing(false) }
  const installSsl = async (domainName: string) => { try { await apiClient.installSsl(domainName); toast.success(`SSL installed for ${domainName}`); loadDashboard() } catch (e: any) { toast.error(e.message || 'SSL installation failed') } }
  const approveTask = async (taskId: string) => { await apiClient.request('/api/agent/tasks', { method: 'POST', body: JSON.stringify({ action: 'approve', taskId }) }); agentHook.loadHistory(); toast.success('Task approved!') }
  const cancelTask = async (taskId: string) => { await apiClient.request('/api/agent/tasks', { method: 'POST', body: JSON.stringify({ action: 'cancel', taskId }) }); agentHook.loadHistory() }

  // ============ NAV & RENDER ============
  const navItems = getNavItems(user)

  if (authLoading) return (<div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-white flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500">Loading FahadCloud...</p></div></div>)

  // Landing pages
  if (!user || currentView === 'landing') {
    if (currentView === 'ai_landing') return <AiLanding onGetStarted={() => setShowRegister(true)} onBack={() => setCurrentView('landing')} />
    return (
      <LandingPage
        showLogin={showLogin} setShowLogin={setShowLogin} showRegister={showRegister} setShowRegister={setShowRegister}
        showAdminLogin={showAdminLogin} setShowAdminLogin={setShowAdminLogin} showRegVerify={showRegVerify} setShowRegVerify={setShowRegVerify}
        showDeleteAccount={showDeleteAccount} setShowDeleteAccount={setShowDeleteAccount}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPass={loginPass} setLoginPass={setLoginPass}
        regName={regName} setRegName={setRegName} regEmail={regEmail} setRegEmail={setRegEmail}
        regPhone={regPhone} setRegPhone={setRegPhone} regPass={regPass} setRegPass={setRegPass}
        authError={authError} setAuthError={setAuthError}
        adminEmail={adminEmail} setAdminEmail={setAdminEmail} adminOtpSent={adminOtpSent} setAdminOtpSent={setAdminOtpSent}
        adminOtp={adminOtp} setAdminOtp={setAdminOtp} adminOtpLoading={adminOtpLoading} adminVerifyLoading={adminVerifyLoading}
        adminError={adminError} setAdminError={setAdminError}
        regOtp={regOtp} setRegOtp={setRegOtp} regOtpLoading={regOtpLoading} regVerifyLoading={regVerifyLoading}
        regPendingEmail={regPendingEmail} setRegPendingEmail={setRegPendingEmail}
        actionVerifyStep={actionVerifyStep} setActionVerifyStep={setActionVerifyStep}
        actionVerifyOtp={actionVerifyOtp} setActionVerifyOtp={setActionVerifyOtp}
        actionVerifyLoading={actionVerifyLoading} deleteAccountLoading={deleteAccountLoading}
        onLogin={doLogin} onRegister={doRegister} onAdminRequestOtp={doAdminRequestOtp} onAdminVerifyOtp={doAdminVerifyOtp}
        onVerifyRegOtp={doVerifyRegOtp} onResendVerification={doResendVerification}
        onRequestActionVerify={requestActionVerify} onVerifyAndDeleteAccount={verifyAndDeleteAccount}
        showForgotPassword={showForgotPassword} setShowForgotPassword={setShowForgotPassword}
        showResetPassword={showResetPassword} setShowResetPassword={setShowResetPassword}
        resetEmail={resetEmail} setResetEmail={setResetEmail}
        onAdminPasswordLogin={doAdminPasswordLogin}
        onNavigate={setCurrentView}
      />
    )
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 text-slate-900 flex">
      {mobileMenu && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileMenu(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 transition-transform lg:translate-x-0', mobileMenu ? 'translate-x-0' : '-translate-x-full')}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Cloud className="w-5 h-5 text-white" /></div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">FahadCloud</span>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMobileMenu(false)}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">{user.firstName[0]}{user.lastName[0]}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{user.firstName} {user.lastName}</div><div className="text-xs text-slate-500 truncate">{user.email}</div></div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setCurrentView(item.id); setMobileMenu(false) }}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition', currentView === item.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                <item.icon className="w-4 h-4" />{item.label}
                {item.badge && <Badge className="ml-auto bg-emerald-500/20 text-emerald-700 border-emerald-200 text-[10px] px-1.5">AI</Badge>}
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <Button variant="ghost" className="w-full text-slate-500 hover:text-red-500 justify-start" onClick={doLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}><Menu className="w-5 h-5" /></Button>
            <h1 className="text-lg font-semibold capitalize">{currentView.replace(/_/g, ' ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">৳{user.balance.toFixed(0)}</Badge>
            {user.role === 'admin' && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">ADMIN</Badge>}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCurrentView('profile')}><Bell className="w-4 h-4" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></Button>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {currentView === 'dashboard' && <DashboardView user={user} domains={domainHook.domains} hostingEnvs={hostingEnvs} dashboardLoading={dashboardLoading} onNavigate={setCurrentView} />}
          {currentView === 'domains' && <DomainsView searchDomain={searchDomainStr} setSearchDomain={setSearchDomainStr} searchResult={domainHook.searchResult} searching={domainHook.searching} domains={domainHook.domains} onDomainSearch={doDomainSearch} onRegisterDomain={doRegisterDomain} />}
          {currentView === 'ai_agent' && <AgentChatView agentMessages={agentHook.messages} agentInput={agentHook.input} setAgentInput={agentHook.setInput} agentLoading={agentHook.loading} agentThinking={agentHook.thinking} agentSuggestions={agentHook.suggestions} orchestrationPlan={agentHook.orchestrationPlan} reasoningChain={agentHook.reasoningChain} showReasoning={showReasoning} setShowReasoning={setShowReasoning} activeAgents={agentHook.activeAgents} agentTasks={agentHook.tasks} onSendMessage={agentHook.sendMessage} onNewChat={agentHook.startNewChat} onApproveTask={approveTask} onCancelTask={cancelTask} onRefreshHistory={agentHook.loadHistory} />}
          {currentView === 'ai_cloud' && <AgentCloudIntel allAgents={agentHook.allAgents} systemOverview={systemOverview} securityStatus={securityStatus} predictions={predictions} agentIconMap={agentIconMap} />}
          {currentView === 'deploy' && <DeployView deployDomain={deployDomain} setDeployDomain={setDeployDomain} deployFramework={deployFramework} setDeployFramework={setDeployFramework} deploying={deploying} deployLog={deployLog} domains={domainHook.domains} onDeploy={startDeploy} onNavigate={setCurrentView} />}
          {currentView === 'monitoring' && <MonitoringView monData={monitoringHook.data} monLoading={monitoringHook.loading} onRefresh={monitoringHook.loadMonitoring} />}
          {currentView === 'hosting' && <HostingView hostingEnvs={hostingEnvs} onNavigate={setCurrentView} onRestartEnv={restartHostingEnv} />}
          {currentView === 'dns' && <DnsManager domains={domainHook.domains} dnsDomain={dnsDomain} setDnsDomain={setDnsDomain} dnsRecords={dnsRecords} dnsLoading={dnsLoading} newDnsRecord={newDnsRecord} setNewDnsRecord={setNewDnsRecord} onLoadDnsRecords={loadDnsRecords} onAddDnsRecord={addDnsRecord} onNavigate={setCurrentView} />}
          {currentView === 'ssl' && <SslView domains={domainHook.domains} onInstallSsl={installSsl} />}
          {currentView === 'storage' && <StorageView user={user} files={files} uploading={uploading} storageLoading={storageLoading} onUpload={uploadFiles} onDeleteFile={() => {}} />}
          {currentView === 'payments' && <PaymentsView paymentOrder={paymentOrder} bkashNumber={bkashNumber} setBkashNumber={setBkashNumber} bkashTrxId={bkashTrxId} setBkashTrxId={setBkashTrxId} paymentProcessing={paymentProcessing} orders={orders} ordersLoading={ordersLoading} onSubmitPayment={submitPayment} />}
          {currentView === 'ai_terminal' && <TerminalView termHistory={termHistory} termInput={termInput} setTermInput={setTermInput} termRunning={termRunning} onExecute={executeCommand} isAdmin={user?.role === 'admin'} />}
          {currentView === 'profile' && <ProfileView user={user} profileEditing={profileEditing} setProfileEditing={setProfileEditing} profileForm={profileForm} setProfileForm={setProfileForm} profileSaving={profileSaving} showChangePassword={showChangePassword} setShowChangePassword={setShowChangePassword} passwordForm={passwordForm} setPasswordForm={setPasswordForm} passwordSaving={false} showCurrentPassword={showCurrentPassword} setShowCurrentPassword={setShowCurrentPassword} showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword} actionVerifyStep={actionVerifyStep} setActionVerifyStep={setActionVerifyStep} actionVerifyOtp={actionVerifyOtp} setActionVerifyOtp={setActionVerifyOtp} actionVerifyLoading={actionVerifyLoading} actionVerifyAction={actionVerifyAction} onSaveProfile={saveProfile} onChangePassword={changePassword} onLogout={doLogout} onDeleteAccount={() => setShowDeleteAccount(true)} />}
          {currentView === 'admin' && user.role === 'admin' && <SuperAdminView onNavigate={setCurrentView} />}
        </div>
      </main>
    </div>
  )
}

export default function FahadCloudApp() {
  return (<AuthProvider><FahadCloudAppInner /></AuthProvider>)
}
