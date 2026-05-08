'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Cloud, Shield, Rocket, Zap, Server, Terminal, Monitor,
  ArrowRight, Sparkles, Check, Bot, Cpu, Globe, Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiLandingProps {
  onGetStarted: () => void;
  onBack: () => void;
}

export default function AiLanding({ onGetStarted, onBack }: AiLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">FahadCloud AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={onBack}>
              Back to Home
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" /> 13 Autonomous Agents
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Meet Your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">AI Cloud Engineer</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            A team of 13 specialized AI agents that deploy, configure, monitor, and secure your cloud infrastructure — autonomously.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8" onClick={onGetStarted}>
              Start Free <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Agent Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">13 Specialized AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Rocket, name: 'Deployment Agent', desc: 'Deploys React, Next.js, Vue, and more with zero config', color: 'from-orange-500 to-red-500' },
              { icon: Shield, name: 'Security Agent', desc: 'Monitors threats, manages firewalls, and enforces policies', color: 'from-emerald-500 to-teal-500' },
              { icon: Monitor, name: 'Monitoring Agent', desc: 'Real-time CPU, RAM, disk, and network monitoring', color: 'from-yellow-500 to-orange-500' },
              { icon: Globe, name: 'DNS Agent', desc: 'Configures and manages DNS records automatically', color: 'from-emerald-500 to-teal-500' },
              { icon: Database, name: 'Database Agent', desc: 'Creates, migrates, and optimizes databases', color: 'from-cyan-500 to-blue-500' },
              { icon: Server, name: 'Server Agent', desc: 'Manages server configuration and resources', color: 'from-gray-500 to-gray-700' },
              { icon: Bot, name: 'Chat Agent', desc: 'Natural language interface for all cloud operations', color: 'from-emerald-500 to-teal-500' },
              { icon: Zap, name: 'SSL Agent', desc: "Installs and auto-renews Let's Encrypt certificates", color: 'from-yellow-400 to-amber-500' },
              { icon: Cpu, name: 'Orchestrator Agent', desc: 'Coordinates all agents and manages task delegation', color: 'from-purple-500 to-indigo-500' },
              { icon: Terminal, name: 'Terminal Agent', desc: 'Safe shell execution with AI-guided commands', color: 'from-gray-600 to-gray-800' },
              { icon: Brain, name: 'Learning Agent', desc: 'Predicts issues and optimizes based on patterns', color: 'from-emerald-500 to-teal-500' },
              { icon: Database, name: 'Backup Agent', desc: 'Automated backups with point-in-time recovery', color: 'from-teal-500 to-cyan-500' },
              { icon: Shield, name: 'Compliance Agent', desc: 'Ensures infrastructure meets security standards', color: 'from-red-500 to-rose-500' },
            ].map((agent, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 transition">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', agent.color)}>
                      <agent.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Online</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tell AI What You Need', desc: 'Type a natural language request like "Deploy my React app to example.com"' },
              { step: '2', title: 'AI Plans & Executes', desc: 'Our 13-agent system creates a plan, assigns specialized agents, and executes' },
              { step: '3', title: 'Monitor & Manage', desc: 'Real-time monitoring, auto-healing, and proactive optimization run continuously' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>&copy; 2024 FahadCloud. Powered by AI. Built on AWS.</p>
      </footer>
    </div>
  );
}
