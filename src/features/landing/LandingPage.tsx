'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Shield, Zap, Brain, Terminal, Monitor, Rocket,
  Cloud, Check, ArrowUpRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoginForm from '@/features/auth/LoginForm';
import RegisterForm from '@/features/auth/RegisterForm';
import AdminLoginDialog from '@/features/auth/AdminLoginDialog';
import EmailVerificationDialog from '@/features/auth/EmailVerificationDialog';
import DeleteAccountDialog from '@/features/profile/DeleteAccountDialog';

interface LandingPageProps {
  // Auth state
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

  // Auth form state
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

  // Admin login state
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

  // Reg verification state
  regOtp: string;
  setRegOtp: (v: string) => void;
  regOtpLoading: boolean;
  regVerifyLoading: boolean;
  regPendingEmail: string;
  setRegPendingEmail: (v: string) => void;

  // Delete account state
  actionVerifyStep: 'idle' | 'request' | 'verify';
  setActionVerifyStep: (v: 'idle' | 'request' | 'verify') => void;
  actionVerifyOtp: string;
  setActionVerifyOtp: (v: string) => void;
  actionVerifyLoading: boolean;
  deleteAccountLoading: boolean;

  // Callbacks
  onLogin: () => void;
  onRegister: () => void;
  onAdminRequestOtp: () => void;
  onAdminVerifyOtp: () => void;
  onVerifyRegOtp: () => void;
  onResendVerification: () => void;
  onRequestActionVerify: (action: string) => void;
  onVerifyAndDeleteAccount: () => void;
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
  onNavigate,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-white text-slate-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">FahadCloud</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
            <a href="#" onClick={() => onNavigate('ai_landing')} className="hover:text-slate-900 transition flex items-center gap-1">
              <Brain className="w-4 h-4" /> AI Agent
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => setShowAdminLogin(true)}>
              <Shield className="w-4 h-4 mr-1" /> Admin
            </Button>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => setShowLogin(true)}>
              Login
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={() => setShowRegister(true)}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-700 border-emerald-200 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" /> 13-Agent AI Cloud Intelligence
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Autonomous
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Cloud Engineer</span>
          </h1>
          <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto">
            Domains, hosting, SSL, DNS, deployments — all managed by your personal AI cloud engineer. Just tell it what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8" onClick={() => setShowRegister(true)}>
              Start Free <ArrowUpRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100 text-lg px-8" onClick={() => onNavigate('ai_landing')}>
              <Brain className="w-5 h-5 mr-2" /> Try AI Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need in the Cloud</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Domain Registration', desc: 'Register domains with real availability checking. Free subdomains and TLDs included.', color: 'from-emerald-500 to-teal-500' },
              { icon: Brain, title: 'AI Cloud Engineer', desc: 'Your personal AI assistant that deploys, configures, and manages your infrastructure.', color: 'from-emerald-500 to-teal-500' },
              { icon: Rocket, title: 'One-Click Deploy', desc: 'Deploy React, Next.js, Vue, Node.js, PHP, Python, and more with a single click.', color: 'from-orange-500 to-red-500' },
              { icon: Shield, title: 'Free SSL', desc: "Automatic Let's Encrypt SSL certificates with auto-renewal for all your domains.", color: 'from-emerald-500 to-teal-500' },
              { icon: Terminal, title: 'AI Terminal', desc: 'Safe shell access with AI-guided commands. Execute npm, pip, git, and more.', color: 'from-gray-500 to-gray-700' },
              { icon: Monitor, title: 'Real-time Monitoring', desc: 'CPU, RAM, disk, network monitoring with alerts and health scoring.', color: 'from-yellow-500 to-orange-500' },
            ].map((f, i) => (
              <Card key={i} className="bg-white border-slate-200 shadow-sm hover:border-emerald-200 transition group">
                <CardHeader>
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', f.color)}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 text-center mb-12">Start free, scale as you grow</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', features: ['1 Free Domain (.fahadcloud.com)', '1GB Storage', 'AI Chat Support', 'Basic Monitoring', 'Shared Hosting'], popular: false },
              { name: 'Pro', price: '৳499/mo', features: ['5 Domains', '50GB Storage', 'AI Agent Full Access', 'Advanced Monitoring', 'Free SSL on All Domains', 'Priority Support'], popular: true },
              { name: 'Enterprise', price: '৳1999/mo', features: ['Unlimited Domains', '500GB Storage', 'AI Agent + Terminal', 'Docker Support', 'Custom SSL', 'Dedicated Resources', '24/7 Support'], popular: false },
            ].map((plan, i) => (
              <Card key={i} className={cn('bg-white border-slate-200 shadow-sm', plan.popular && 'border-emerald-200 ring-1 ring-emerald-500/20')}>
                {plan.popular && <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-center text-sm py-1 font-medium text-white">Most Popular</div>}
                <CardHeader className="text-center">
                  <CardTitle className="text-slate-900">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-slate-900 mt-2">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn('w-full', plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' : 'bg-slate-800 hover:bg-slate-700')}
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

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>&copy; 2024 FahadCloud. Powered by AI. Built on AWS.</p>
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
    </div>
  );
}
