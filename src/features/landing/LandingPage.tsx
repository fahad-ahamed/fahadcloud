'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Shield, Zap, Brain, Terminal, Monitor, Rocket,
  Cloud, Check, ArrowUpRight, Sparkles, Server, HardDrive,
  Lock, CreditCard, Headphones, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoginForm from '@/features/auth/LoginForm';
import ForgotPasswordDialog from '@/features/auth/ForgotPasswordDialog';
import ResetPasswordDialog from '@/features/auth/ResetPasswordDialog';
import RegisterForm from '@/features/auth/RegisterForm';
import AdminLoginDialog from '@/features/auth/AdminLoginDialog';
import EmailVerificationDialog from '@/features/auth/EmailVerificationDialog';
import DeleteAccountDialog from '@/features/profile/DeleteAccountDialog';

interface LandingPageProps {
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  showRegister: boolean;
  setShowRegister: (v: boolean) => void;
  showAdminLogin: boolean;
  setShowAdminLogin: (v: boolean) => void;
  showRegVerify: boolean;
  setShowRegVerify: (v: boolean) => void;
  showDeleteAccount: boolean;
  setShowDeleteAccount: (v: boolean) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPass: string;
  setLoginPass: (v: string) => void;
  regName: string;
  setRegName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPhone: string;
  setRegPhone: (v: string) => void;
  regPass: string;
  setRegPass: (v: string) => void;
  authError: string;
  setAuthError: (v: string) => void;
  adminEmail: string;
  setAdminEmail: (v: string) => void;
  adminOtpSent: boolean;
  setAdminOtpSent: (v: boolean) => void;
  adminOtp: string;
  setAdminOtp: (v: string) => void;
  adminOtpLoading: boolean;
  adminVerifyLoading: boolean;
  adminError: string;
  setAdminError: (v: string) => void;
  regOtp: string;
  setRegOtp: (v: string) => void;
  regOtpLoading: boolean;
  regVerifyLoading: boolean;
  regPendingEmail: string;
  setRegPendingEmail: (v: string) => void;
  actionVerifyStep: 'idle' | 'request' | 'verify';
  setActionVerifyStep: (v: 'idle' | 'request' | 'verify') => void;
  actionVerifyOtp: string;
  setActionVerifyOtp: (v: string) => void;
  actionVerifyLoading: boolean;
  deleteAccountLoading: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onAdminRequestOtp: () => void;
  onAdminVerifyOtp: () => void;
  onAdminPasswordLogin?: (email: string, password: string) => Promise<void>;
  onVerifyRegOtp: () => void;
  onResendVerification: () => void;
  onRequestActionVerify: (action: string) => void;
  onVerifyAndDeleteAccount: () => void;
  showForgotPassword: boolean;
  setShowForgotPassword: (v: boolean) => void;
  showResetPassword: boolean;
  setShowResetPassword: (v: boolean) => void;
  resetEmail: string;
  setResetEmail: (v: string) => void;
  onNavigate: (view: string) => void;
}

export default function LandingPage({
  showLogin, setShowLogin,
  showRegister, setShowRegister,
  showAdminLogin, setShowAdminLogin,
  showRegVerify, setShowRegVerify,
  showDeleteAccount, setShowDeleteAccount,
  loginEmail, setLoginEmail,
  loginPass, setLoginPass,
  regName, setRegName,
  regEmail, setRegEmail,
  regPhone, setRegPhone,
  regPass, setRegPass,
  authError, setAuthError,
  adminEmail, setAdminEmail,
  adminOtpSent, setAdminOtpSent,
  adminOtp, setAdminOtp,
  adminOtpLoading, adminVerifyLoading,
  adminError, setAdminError,
  regOtp, setRegOtp,
  regOtpLoading, regVerifyLoading,
  regPendingEmail, setRegPendingEmail,
  actionVerifyStep, setActionVerifyStep,
  actionVerifyOtp, setActionVerifyOtp,
  actionVerifyLoading, deleteAccountLoading,
  onLogin, onRegister,
  onAdminRequestOtp, onAdminVerifyOtp,
  onVerifyRegOtp, onResendVerification,
  onRequestActionVerify, onVerifyAndDeleteAccount,
  onAdminPasswordLogin,
  showForgotPassword, setShowForgotPassword,
  showResetPassword, setShowResetPassword,
  resetEmail, setResetEmail,
  onNavigate,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-white text-slate-900 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">FahadCloud</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">Features</a>
            <a href="#services" className="hover:text-emerald-600 transition">Services</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Pricing</a>
            <a href="#" onClick={() => onNavigate('ai_landing')} className="hover:text-emerald-600 transition flex items-center gap-1">
              <Brain className="w-4 h-4" /> AI Agent
            </a>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hidden sm:flex" onClick={() => setShowAdminLogin(true)}>
              <Shield className="w-4 h-4 mr-1" /> Admin
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => setShowLogin(true)}>
              Login
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 whitespace-nowrap" onClick={() => setShowRegister(true)}>
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Sign Up</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-700 border-emerald-200 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" /> 14-Agent AI Cloud Intelligence
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Autonomous
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Cloud Engineer</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Domains, hosting, SSL, DNS, deployments — all managed by your personal AI cloud engineer. Just tell it what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-none mx-auto">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap" onClick={() => setShowRegister(true)}>
              Start Free <ArrowUpRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100 text-base px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap" onClick={() => onNavigate('ai_landing')}>
              <Brain className="w-5 h-5 mr-2" /> Try AI Agent
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-500 hover:text-slate-900 text-base px-6 sm:px-8 w-full sm:w-auto whitespace-nowrap" onClick={() => setShowLogin(true)}>
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Services Section */}
      <section id="services" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Globe, title: 'Register Domain', desc: 'Free & paid domains', color: 'from-emerald-500 to-teal-500', action: () => setShowRegister(true) },
              { icon: Rocket, title: 'Deploy Website', desc: 'One-click deployment', color: 'from-orange-500 to-red-500', action: () => setShowRegister(true) },
              { icon: Shield, title: 'Free SSL', desc: "Let's Encrypt SSL", color: 'from-blue-500 to-indigo-500', action: () => setShowRegister(true) },
              { icon: Brain, title: 'AI Agent', desc: '13 AI cloud agents', color: 'from-purple-500 to-pink-500', action: () => onNavigate('ai_landing') },
            ].map((s, i) => (
              <button key={i} onClick={s.action}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer">
                <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform', s.color)}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900 text-sm">{s.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Everything You Need in the Cloud</h2>
          <p className="text-slate-500 text-center mb-10 text-sm">Complete platform powered by AI intelligence</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Globe, title: 'Domain Registration', desc: 'Register domains with real availability checking. Free .fahadcloud.com subdomains and popular TLDs included.', color: 'from-emerald-500 to-teal-500' },
              { icon: Brain, title: 'AI Cloud Engineer', desc: 'Your personal AI assistant that deploys, configures, and manages your infrastructure automatically.', color: 'from-purple-500 to-pink-500' },
              { icon: Rocket, title: 'One-Click Deploy', desc: 'Deploy React, Next.js, Vue, Node.js, PHP, Python, and more with a single click.', color: 'from-orange-500 to-red-500' },
              { icon: Shield, title: 'Free SSL Certificates', desc: "Automatic Let's Encrypt SSL certificates with auto-renewal for all your domains.", color: 'from-blue-500 to-indigo-500' },
              { icon: Terminal, title: 'AI Terminal', desc: 'Safe shell access with AI-guided commands. Execute npm, pip, git, and more securely.', color: 'from-gray-600 to-gray-800' },
              { icon: Monitor, title: 'Real-time Monitoring', desc: 'CPU, RAM, disk, network monitoring with alerts and health scoring.', color: 'from-yellow-500 to-orange-500' },
              { icon: Server, title: 'Managed Hosting', desc: 'Shared, VPS, and dedicated hosting plans with automatic scaling and 99.9% uptime.', color: 'from-emerald-500 to-teal-500' },
              { icon: HardDrive, title: 'Cloud Storage', desc: 'Secure file storage with up to 500GB capacity, file manager, and public sharing links.', color: 'from-cyan-500 to-blue-500' },
              { icon: Lock, title: 'DNS Management', desc: 'Full DNS zone editor with A, AAAA, CNAME, MX, TXT, and SRV record support.', color: 'from-indigo-500 to-purple-500' },
            ].map((f, i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition group">
                <CardHeader className="pb-3">
                  <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2', f.color)}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 text-center mb-10 text-sm">Start free, scale as you grow</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: 'Free', features: ['1 Free Domain (.fahadcloud.com)', '1GB Storage', 'AI Chat Support', 'Basic Monitoring', 'Shared Hosting'], popular: false },
              { name: 'Pro', price: 'BDT 499/mo', features: ['5 Domains', '50GB Storage', 'AI Agent Full Access', 'Advanced Monitoring', 'Free SSL on All Domains', 'Priority Support'], popular: true },
              { name: 'Enterprise', price: 'BDT 1,999/mo', features: ['Unlimited Domains', '500GB Storage', 'AI Agent + Terminal', 'Docker Support', 'Custom SSL', 'Dedicated Resources', '24/7 Support'], popular: false },
            ].map((plan, i) => (
              <Card key={i} className={cn('bg-white border-slate-200 shadow-sm', plan.popular && 'border-emerald-200 ring-1 ring-emerald-500/20')}>
                {plan.popular && <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-center text-sm py-1 font-medium text-white rounded-t-lg">Most Popular</div>}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-slate-900 text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn('w-full whitespace-nowrap', plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' : 'bg-slate-800 hover:bg-slate-700')}
                    onClick={() => setShowRegister(true)}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'AI Agents', value: '13', icon: Brain },
            { label: 'Uptime', value: '99.9%', icon: Clock },
            { label: 'Free Domain', value: '.fahadcloud.com', icon: Globe },
            { label: 'Support', value: '24/7', icon: Headphones },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <s.icon className="w-6 h-6 text-emerald-500" />
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Launch?</h2>
          <p className="text-emerald-100 mb-6">Get your free domain and deploy your first website in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-none mx-auto">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold w-full sm:w-auto whitespace-nowrap" onClick={() => setShowRegister(true)}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto whitespace-nowrap" onClick={() => onNavigate('ai_landing')}>
              <Brain className="w-5 h-5 mr-2" /> Explore AI Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">FahadCloud</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-slate-600 transition">Features</a>
            <a href="#pricing" className="hover:text-slate-600 transition">Pricing</a>
            <a href="#" onClick={() => onNavigate('ai_landing')} className="hover:text-slate-600 transition">AI Agent</a>
            <a href="#" onClick={() => setShowAdminLogin(true)} className="hover:text-slate-600 transition">Admin</a>
          </div>
          <p className="text-xs text-slate-400">2024 FahadCloud. Powered by AI. Built on AWS.</p>
        </div>
      </footer>

      {/* Login Dialog */}
      <LoginForm
        open={showLogin}
        onOpenChange={setShowLogin}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPass={loginPass}
        setLoginPass={setLoginPass}
        authError={authError}
        onLogin={onLogin}
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
        onSwitchToVerify={() => { setShowLogin(false); setRegPendingEmail(loginEmail); setShowRegVerify(true); }}
            onSwitchToForgotPassword={() => { setShowLogin(false); setResetEmail(loginEmail); setShowForgotPassword(true); }}
      />

      {/* Register Dialog */}
      <RegisterForm
        open={showRegister}
        onOpenChange={setShowRegister}
        regName={regName}
        setRegName={setRegName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPhone={regPhone}
        setRegPhone={setRegPhone}
        regPass={regPass}
        setRegPass={setRegPass}
        authError={authError}
        onRegister={onRegister}
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
      />

      {/* Admin Login Dialog */}
      <AdminLoginDialog
        open={showAdminLogin}
        onOpenChange={(open) => { setShowAdminLogin(open); if (!open) { setAdminOtpSent(false); setAdminOtp(''); setAdminEmail(''); setAdminError(''); } }}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        adminOtpSent={adminOtpSent}
        setAdminOtpSent={setAdminOtpSent}
        adminOtp={adminOtp}
        setAdminOtp={setAdminOtp}
        adminOtpLoading={adminOtpLoading}
        adminVerifyLoading={adminVerifyLoading}
        adminError={adminError}
        onRequestOtp={onAdminRequestOtp}
        onVerifyOtp={onAdminVerifyOtp}
        onAdminPasswordLogin={onAdminPasswordLogin}
      />

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        open={showRegVerify}
        onOpenChange={(open) => { setShowRegVerify(open); if (!open) { setRegOtp(''); setAuthError(''); } }}
        regOtp={regOtp}
        setRegOtp={setRegOtp}
        regOtpLoading={regOtpLoading}
        regVerifyLoading={regVerifyLoading}
        regPendingEmail={regPendingEmail}
        authError={authError}
        onVerify={onVerifyRegOtp}
        onResend={onResendVerification}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={(open) => { setShowDeleteAccount(open); if (!open) { setActionVerifyStep('idle'); setActionVerifyOtp(''); } }}
        actionVerifyStep={actionVerifyStep}
        actionVerifyOtp={actionVerifyOtp}
        setActionVerifyOtp={setActionVerifyOtp}
        actionVerifyLoading={actionVerifyLoading}
        deleteAccountLoading={deleteAccountLoading}
        onRequestVerify={() => onRequestActionVerify('account_delete')}
        onDelete={onVerifyAndDeleteAccount}
        onCancel={() => { setShowDeleteAccount(false); setActionVerifyStep('idle'); setActionVerifyOtp(''); }}
      />

      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onSwitchToLogin={() => { setShowForgotPassword(false); setShowLogin(true); }}
        onSwitchToReset={(email) => { setShowForgotPassword(false); setResetEmail(email); setShowResetPassword(true); }}
      />

      <ResetPasswordDialog
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        resetEmail={resetEmail}
        onSwitchToLogin={() => { setShowResetPassword(false); setShowLogin(true); }}
        onSwitchToForgot={() => { setShowResetPassword(false); setShowForgotPassword(true); }}
      />
    </div>
  );
}
