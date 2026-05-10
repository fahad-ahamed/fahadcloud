'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Cloud, Shield, Rocket, Zap, Server, Terminal, Monitor,
  ArrowRight, Sparkles, Bot, Cpu, Globe, Database, RotateCcw,
  TrendingUp, Lock, Activity, GitBranch, Workflow, Eye,
  ChevronRight, Play, CheckCircle2, Clock, Users, BarChart3,
  Layers, Cog, BookOpen, GraduationCap, Search, Wrench, Code, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoginForm from '@/features/auth/LoginForm';
import ForgotPasswordDialog from '@/features/auth/ForgotPasswordDialog';
import ResetPasswordDialog from '@/features/auth/ResetPasswordDialog';
import RegisterForm from '@/features/auth/RegisterForm';
import AdminLoginDialog from '@/features/auth/AdminLoginDialog';
import EmailVerificationDialog from '@/features/auth/EmailVerificationDialog';

interface AiLandingProps {
  onGetStarted: () => void;
  onBack: () => void;
}

const AGENTS = [
  { icon: Rocket, name: 'DevOps Agent', desc: 'CI/CD pipelines, build optimization, deployment workflows, and automated release management with zero-downtime deploys.', color: 'from-orange-500 to-red-500', status: 'active', tasks: '2.4K' },
  { icon: Shield, name: 'Security Agent', desc: 'Real-time threat detection, intrusion prevention, vulnerability scanning, firewall optimization, and compliance enforcement.', color: 'from-emerald-500 to-teal-500', status: 'active', tasks: '8.1K' },
  { icon: Monitor, name: 'Monitoring Agent', desc: '24/7 CPU, RAM, disk, and network monitoring with intelligent alerting, anomaly detection, and predictive scaling.', color: 'from-yellow-500 to-orange-500', status: 'active', tasks: '15K' },
  { icon: Globe, name: 'DNS Agent', desc: 'Automatic DNS configuration, zone management, record optimization, and propagation verification across all domains.', color: 'from-sky-500 to-blue-500', status: 'active', tasks: '3.2K' },
  { icon: Database, name: 'Database Agent', desc: 'Intelligent database creation, migration, backup scheduling, query optimization, and performance tuning.', color: 'from-cyan-500 to-blue-500', status: 'active', tasks: '5.7K' },
  { icon: Server, name: 'Infrastructure Agent', desc: 'Docker/K8s orchestration, server provisioning, cluster management, and infrastructure-as-code generation.', color: 'from-gray-500 to-gray-700', status: 'active', tasks: '4.3K' },
  { icon: Bot, name: 'Chat Agent', desc: 'Natural language interface with context-aware understanding, multi-turn conversations, and intelligent command routing.', color: 'from-emerald-500 to-teal-500', status: 'active', tasks: '22K' },
  { icon: Zap, name: 'SSL Agent', desc: "Automated Let's Encrypt provisioning, wildcard certificates, auto-renewal, and HTTPS enforcement across all endpoints.", color: 'from-yellow-400 to-amber-500', status: 'active', tasks: '6.8K' },
  { icon: Cpu, name: 'Orchestrator Agent', desc: 'Master coordination engine that delegates tasks to specialized agents, manages workflows, and ensures optimal resource allocation.', color: 'from-purple-500 to-indigo-500', status: 'active', tasks: '31K' },
  { icon: Terminal, name: 'Terminal Agent', desc: 'AI-guided shell execution with command validation, sandbox isolation, output analysis, and safety enforcement.', color: 'from-gray-600 to-gray-800', status: 'active', tasks: '9.5K' },
  { icon: Brain, name: 'Learning Agent', desc: 'Predictive analysis, pattern recognition, workflow optimization, and continuous learning from infrastructure data.', color: 'from-emerald-500 to-teal-500', status: 'active', tasks: '12K' },
  { icon: RotateCcw, name: 'Recovery Agent', desc: 'Automated backup management, point-in-time recovery, disaster recovery orchestration, and data integrity verification.', color: 'from-teal-500 to-cyan-500', status: 'active', tasks: '1.9K' },
  { icon: TrendingUp, name: 'Optimization Agent', desc: 'Performance profiling, resource right-sizing, cost optimization, and intelligent auto-scaling recommendations.', color: 'from-pink-500 to-rose-500', status: 'active', tasks: '7.4K' },
  { icon: Code, name: 'Coding Agent', desc: 'AI-powered code generation, refactoring, and review across multiple languages.', color: 'from-blue-500 to-cyan-500', status: 'ai', tasks: 'NEW' },
  { icon: Palette, name: 'UI Agent', desc: 'AI-powered UI/UX design with component generation and accessibility analysis.', color: 'from-pink-500 to-rose-500', status: 'ai', tasks: 'NEW' },
  { icon: BookOpen, name: 'Research Agent', desc: 'AI-powered web research with real-time information gathering and knowledge synthesis.', color: 'from-teal-500 to-cyan-500', status: 'ai', tasks: 'NEW' },
  { icon: Cog, name: 'Self-Improvement Agent', desc: 'AI that continuously analyzes and improves the FahadCloud system itself.', color: 'from-fuchsia-500 to-purple-500', status: 'ai', tasks: 'NEW' },
  { icon: Search, name: 'Bug Detector Agent', desc: 'AI-powered continuous scanning for broken APIs, dead code, and security vulnerabilities.', color: 'from-red-400 to-orange-500', status: 'ai', tasks: 'NEW' },
  { icon: Wrench, name: 'Auto Fix Agent', desc: 'AI-powered automatic bug fixing with patch generation and safe rollback.', color: 'from-green-500 to-emerald-500', status: 'ai', tasks: 'NEW' },

];

const AUTO_LEARNING_AGENT = {
  icon: GraduationCap,
  name: 'Auto Learning Agent',
  desc: 'Continuously trains and improves all FahadCloud AI agents using project data, user interactions, system metrics, and cross-domain insights. Unlimited, scalable, autonomous learning engine.',
  color: 'from-violet-600 to-fuchsia-500',
  status: 'active',
  tasks: '24/7',
};

export default function AiLanding({ onGetStarted, onBack }: AiLandingProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showRegVerify, setShowRegVerify] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpLoading, setAdminOtpLoading] = useState(false);
  const [adminVerifyLoading, setAdminVerifyLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpLoading, setRegOtpLoading] = useState(false);
  const [regVerifyLoading, setRegVerifyLoading] = useState(false);
  const [regPendingEmail, setRegPendingEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('');
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  const handleStartFree = () => {
    setShowRegister(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">FahadCloud AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex" onClick={onBack}>
              Back to Home
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => setShowLogin(true)}>
              Login
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20 whitespace-nowrap" onClick={handleStartFree}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">14 Autonomous AI Agents</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full">NEW</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight">
            Your Personal
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">AI Cloud Engineer</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            14 specialized AI agents that deploy, configure, monitor, and secure your entire cloud infrastructure — completely autonomously.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base sm:text-lg px-6 sm:px-8 py-3 shadow-xl shadow-emerald-500/25 w-full sm:w-auto whitespace-nowrap"
              onClick={handleStartFree}
            >
              Start FREE <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/10 text-white hover:bg-white/5 hover:border-white/20 text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto whitespace-nowrap"
              onClick={onBack}
            >
              <Play className="w-4 h-4 mr-2" /> Learn More
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { label: 'AI Agents', value: '14', icon: Brain },
              { label: 'Tasks Completed', value: '128K+', icon: CheckCircle2 },
              { label: 'Uptime', value: '99.9%', icon: Clock },
              { label: 'Active Users', value: '2.4K+', icon: Users },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-300">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auto Learning Agent - Featured */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-purple-600/20 border border-violet-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-[60px]" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 shrink-0">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">NEW AGENT</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">24/7 ACTIVE</Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Auto Learning Agent</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Continuously trains and improves all FahadCloud AI agents using project data, user interactions, system metrics, and cross-domain insights. 
                  Unlimited, scalable, autonomous learning that makes every agent smarter over time. The more you use FahadCloud, the better it gets.
                </p>
                <div className="flex flex-wrap gap-3 mt-4 justify-center lg:justify-start">
                  {['Continuous Training', 'Cross-Agent Learning', 'Pattern Recognition', 'Auto Optimization', 'Knowledge Graph', 'Predictive Models'].map((f, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Grid */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">14 Specialized AI Agents</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">Each agent is an expert in its domain, working together to manage your entire cloud infrastructure autonomously.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* Auto Learning Agent first */}
            <Card 
              className="bg-gradient-to-br from-violet-600/10 to-fuchsia-500/5 border-violet-500/20 hover:border-violet-500/40 transition-all duration-300 group cursor-pointer"
              onMouseEnter={() => setHoveredAgent(-1)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300', AUTO_LEARNING_AGENT.color, hoveredAgent === -1 && 'scale-110')}>
                    <AUTO_LEARNING_AGENT.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{AUTO_LEARNING_AGENT.name}</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium">{AUTO_LEARNING_AGENT.status}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">{AUTO_LEARNING_AGENT.tasks} tasks</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{AUTO_LEARNING_AGENT.desc}</p>
              </CardContent>
            </Card>
            
            {/* Other 13 agents */}
            {AGENTS.map((agent, i) => (
              <Card 
                key={i} 
                className="bg-white/[0.03] border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 group cursor-pointer"
                onMouseEnter={() => setHoveredAgent(i)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300', agent.color, hoveredAgent === i && 'scale-110')}>
                      <agent.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{agent.name}</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-medium">{agent.status}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{agent.tasks} tasks</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-slate-400 text-sm sm:text-base">Three simple steps to autonomous cloud management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'Tell AI What You Need', desc: 'Type a natural language request like "Deploy my React app to example.com with SSL" and our AI understands your intent.', icon: MessageCircle },
              { step: '02', title: 'AI Plans & Executes', desc: 'Our 14-agent system creates an intelligent plan, delegates to specialized agents, and executes with full transparency.', icon: Workflow },
              { step: '03', title: 'Monitor & Optimize', desc: 'Real-time monitoring, auto-healing, predictive maintenance, and continuous optimization run 24/7 without intervention.', icon: BarChart3 },
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 sm:p-8 hover:border-emerald-500/30 transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                      <s.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-lg">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10">
                    <ChevronRight className="w-8 h-8 text-emerald-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-cyan-600/20 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Ready to Launch?</h2>
              <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto">
                Deploy your first project in minutes with 14 AI agents managing everything for you. 100% FREE. No credit card required. Unlimited everything.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base sm:text-lg px-6 sm:px-8 shadow-xl shadow-emerald-500/25 w-full sm:w-auto"
                  onClick={handleStartFree}
                >
                  Start FREE <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/10 text-white hover:bg-white/5 hover:border-white/20 w-full sm:w-auto"
                  onClick={onBack}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 px-4 border-t border-white/5 text-center">
        <p className="text-slate-400 text-xs sm:text-sm">&copy; 2025 FahadCloud. Powered by 14 AI Agents. Built on AWS.</p>
      </footer>

      {/* Auth Dialogs - FIXED: Now included in AiLanding */}
      <LoginForm
        open={showLogin}
        onOpenChange={setShowLogin}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPass={loginPass}
        setLoginPass={setLoginPass}
        authError={authError}
        onLogin={async () => {
          setAuthError('');
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.login(loginEmail, loginPass);
            setShowLogin(false);
            window.location.reload();
          } catch (e: any) {
            setAuthError(e.message || 'Login failed');
          }
        }}
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
        onSwitchToVerify={() => {}}
        onSwitchToForgotPassword={() => { setShowLogin(false); setResetEmail(loginEmail); setShowForgotPassword(true); }}
      />

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
        onRegister={async () => {
          setAuthError('');
          try {
            const { apiClient } = await import('@/services/api');
            const names = regName.split(' ');
            await apiClient.register({
              firstName: names[0] || '',
              lastName: names.slice(1).join(' ') || '',
              email: regEmail,
              phone: regPhone,
              password: regPass,
            });
            setShowRegister(false);
            setRegPendingEmail(regEmail.toLowerCase());
            setShowRegVerify(true);
          } catch (e: any) {
            setAuthError(e.message || 'Registration failed');
          }
        }}
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
      />

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
        onRequestOtp={async () => {
          setAdminError('');
          if (!adminEmail.trim()) { setAdminError('Please enter your email'); return; }
          setAdminOtpLoading(true);
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.adminLoginRequest(adminEmail.trim());
            setAdminOtpSent(true);
          } catch (e: any) { setAdminError(e.message || 'Failed to send OTP'); }
          setAdminOtpLoading(false);
        }}
        onVerifyOtp={async () => {
          setAdminError('');
          if (!adminOtp.trim()) { setAdminError('Please enter the verification code'); return; }
          setAdminVerifyLoading(true);
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.adminLoginVerify(adminEmail.trim(), adminOtp.trim());
            setShowAdminLogin(false);
            window.location.reload();
          } catch (e: any) { setAdminError(e.message || 'Verification failed'); }
          setAdminVerifyLoading(false);
        }}
        onAdminPasswordLogin={async (email: string, password: string) => {
          setAdminError('');
          setAdminOtpLoading(true);
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.login(email, password);
            setShowAdminLogin(false);
            window.location.reload();
          } catch (e: any) {
            setAdminError(e.message || 'Invalid email or password');
          }
          setAdminOtpLoading(false);
        }}
      />

      <EmailVerificationDialog
        open={showRegVerify}
        onOpenChange={(open) => { setShowRegVerify(open); if (!open) { setRegOtp(''); setAuthError(''); } }}
        regOtp={regOtp}
        setRegOtp={setRegOtp}
        regOtpLoading={regOtpLoading}
        regVerifyLoading={regVerifyLoading}
        regPendingEmail={regPendingEmail}
        authError={authError}
        onVerify={async () => {
          setAuthError('');
          if (!regOtp.trim()) { setAuthError('Please enter the verification code'); return; }
          setRegVerifyLoading(true);
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.verifyEmail(regPendingEmail, regOtp.trim());
            setShowRegVerify(false);
            setShowLogin(true);
            setLoginEmail(regPendingEmail);
          } catch (e: any) { setAuthError(e.message || 'Verification failed'); }
          setRegVerifyLoading(false);
        }}
        onResend={async () => {
          setAuthError('');
          setRegOtpLoading(true);
          try {
            const { apiClient } = await import('@/services/api');
            await apiClient.resendVerification(regPendingEmail);
          } catch (e: any) { setAuthError(e.message || 'Failed to resend'); }
          setRegOtpLoading(false);
        }}
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

// Need this import for the How It Works section
function MessageCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
