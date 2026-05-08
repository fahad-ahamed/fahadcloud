'use client';
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TerminalHistoryEntry {
  cmd: string;
  output: string;
  exitCode: number;
}

interface TerminalViewProps {
  termHistory: TerminalHistoryEntry[];
  termInput: string;
  setTermInput: (v: string) => void;
  termRunning: boolean;
  onExecute: () => void;
}

export default function TerminalView({
  termHistory, termInput, setTermInput,
  termRunning, onExecute,
}: TerminalViewProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-green-400 text-sm font-mono ml-2">fahadcloud-terminal</span>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto text-[10px]">AI-Sandboxed</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 font-mono text-sm">
          <div className="h-80 overflow-y-auto space-y-2 mb-4">
            <div className="text-green-400">Welcome to FahadCloud AI Terminal v2.0</div>
            <div className="text-slate-400">All commands are executed in a sandboxed environment.</div>
            <div className="text-slate-400">Dangerous commands are automatically blocked.</div>
            <div className="text-slate-400">Type &apos;help&apos; for available commands.</div>
            <div className="text-slate-400">---</div>
            {termHistory.map((h, i) => (
              <div key={i}>
                <div className="text-cyan-400">$ {h.cmd}</div>
                <pre className={cn('whitespace-pre-wrap', h.exitCode === 0 ? 'text-slate-300' : 'text-red-400')}>{h.output}</pre>
              </div>
            ))}
            {termRunning && <div className="text-amber-400 animate-pulse">Executing...</div>}
          </div>
          <div className="flex gap-2">
            <span className="text-green-400">$</span>
            <Input
              className="flex-1 bg-transparent border-0 text-green-400 font-mono focus-visible:ring-0 p-0 h-6"
              placeholder="Enter command..."
              value={termInput}
              onChange={e => setTermInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onExecute()}
              disabled={termRunning}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="text-sm font-medium">Quick Commands</div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['npm --version', 'node --version', 'pwd', 'ls', 'whoami', 'df -h', 'free -m', 'uptime', 'pm2 list'].map((cmd, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-mono text-xs"
              onClick={() => setTermInput(cmd)}
            >
              {cmd}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
