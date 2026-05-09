'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, Loader2, Code, Layers, Box, Server, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Domain } from '@/types';

interface DeployViewProps {
  deployDomain: string;
  setDeployDomain: (v: string) => void;
  deployFramework: string;
  setDeployFramework: (v: string) => void;
  deploying: boolean;
  deployLog: string;
  domains: Domain[];
  onDeploy: () => void;
  onNavigate: (view: string) => void;
}

const frameworks = [
  { id: 'static', name: 'HTML/CSS', icon: Code, color: 'from-orange-500 to-red-500' },
  { id: 'react', name: 'React', icon: Layers, color: 'from-cyan-400 to-teal-500' },
  { id: 'nextjs', name: 'Next.js', icon: Box, color: 'from-gray-700 to-gray-900' },
  { id: 'vue', name: 'Vue.js', icon: Layers, color: 'from-green-400 to-emerald-600' },
  { id: 'nodejs', name: 'Node.js', icon: Server, color: 'from-green-500 to-green-700' },
  { id: 'express', name: 'Express', icon: Zap, color: 'from-gray-600 to-gray-800' },
  { id: 'php', name: 'PHP', icon: Code, color: 'from-indigo-400 to-indigo-600' },
  { id: 'python', name: 'Python', icon: Code, color: 'from-yellow-400 to-teal-500' },
  { id: 'laravel', name: 'Laravel', icon: Zap, color: 'from-red-500 to-red-700' },
  { id: 'wordpress', name: 'WordPress', icon: FileText, color: 'from-teal-400 to-teal-700' },
];

export default function DeployView({
  deployDomain, setDeployDomain,
  deployFramework, setDeployFramework,
  deploying, deployLog, domains,
  onDeploy, onNavigate,
}: DeployViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-500/20">
        <CardContent className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">One-Click AI Deployment</h2>
          <p className="text-slate-500">Select your framework and domain, and our AI will handle everything automatically.</p>
        </CardContent>
      </Card>

      {/* Framework Selection */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Select Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {frameworks.map(f => (
              <button
                key={f.id}
                onClick={() => setDeployFramework(f.id)}
                className={cn('p-4 rounded-xl border transition text-center', deployFramework === f.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100')}
              >
                <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br mx-auto mb-2 flex items-center justify-center', f.color)}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs sm:text-sm font-medium">{f.name}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Selection */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Select Domain</CardTitle>
        </CardHeader>
        <CardContent>
          {domains.length > 0 ? (
            <Select value={deployDomain} onValueChange={setDeployDomain}>
              <SelectTrigger className="bg-white border-slate-200 focus:border-emerald-400">
                <SelectValue placeholder="Choose a domain" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 focus:border-emerald-400">
                {domains.map(d => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 mb-2">No domains yet</p>
              <Button variant="outline" onClick={() => onNavigate('domains')}>
                Register a Domain First
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <Button className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" onClick={onDeploy} disabled={deploying || !deployDomain || !deployFramework}>
        {deploying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5 mr-2" />
            Deploy with AI
          </>
        )}
      </Button>

      {/* Deploy Log */}
      {deployLog && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Deployment Log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded-lg text-xs text-emerald-400 font-mono overflow-auto max-h-60">{deployLog}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
