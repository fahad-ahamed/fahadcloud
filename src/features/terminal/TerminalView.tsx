'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Monitor, HardDrive, Cpu, MemoryStick, Container, RefreshCw,
  Shield, ShieldCheck,
} from 'lucide-react';

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
  isAdmin?: boolean;
}

export default function TerminalView({
  termHistory, termInput, setTermInput,
  termRunning, onExecute, isAdmin = false,
}: TerminalViewProps) {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Track command history for up/down arrow navigation
  useEffect(() => {
    if (termHistory.length > 0) {
      const lastCmd = termHistory[termHistory.length - 1]!.cmd;
      if (lastCmd && (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== lastCmd)) {
        setCommandHistory(prev => [...prev, lastCmd]);
      }
    }
  }, [termHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [termHistory, termRunning]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onExecute();
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setTermInput(commandHistory[commandHistory.length - 1 - newIndex] ?? '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTermInput(commandHistory[commandHistory.length - 1 - newIndex] ?? '');
      } else {
        setHistoryIndex(-1);
        setTermInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      setTermInput('');
    }
  }, [onExecute, commandHistory, historyIndex, setTermInput]);

  const quickAction = (cmd: string) => {
    setTermInput(cmd);
    setTimeout(() => onExecute(), 0);
  };

  const userQuickActions = [
    { label: 'System Info', cmd: 'uname -a', icon: Monitor },
    { label: 'Docker Status', cmd: 'docker ps', icon: Container },
    { label: 'Disk Usage', cmd: 'df -h', icon: HardDrive },
    { label: 'Memory', cmd: 'free -m', icon: MemoryStick },
    { label: 'Processes', cmd: 'ps aux | head -20', icon: Cpu },
    { label: 'PM2 Status', cmd: 'pm2 list', icon: Monitor },
    { label: 'AI Status', cmd: 'ai-status', icon: RefreshCw },
    { label: 'Uptime', cmd: 'uptime', icon: Monitor },
  ];

  const adminQuickActions = [
    { label: 'System Info', cmd: 'uname -a', icon: Monitor },
    { label: 'Docker Status', cmd: 'docker ps -a', icon: Container },
    { label: 'Disk Usage', cmd: 'df -h', icon: HardDrive },
    { label: 'Memory', cmd: 'free -m', icon: MemoryStick },
    { label: 'PM2 Status', cmd: 'pm2 list', icon: Monitor },
    { label: 'Nginx Status', cmd: 'systemctl status nginx', icon: Monitor },
    { label: 'Systemd Services', cmd: 'systemctl list-units --type=service --state=running | head -20', icon: ShieldCheck },
    { label: 'AI Status', cmd: 'ai-status', icon: RefreshCw },
    { label: 'Network Connections', cmd: 'ss -tlnp', icon: Monitor },
    { label: 'Firewall', cmd: 'sudo ufw status', icon: Shield },
    { label: 'Journal Logs', cmd: 'journalctl -u fahadcloud --no-pager -n 30', icon: Monitor },
    { label: 'Uptime', cmd: 'uptime', icon: Monitor },
  ];

  const quickActions = isAdmin ? adminQuickActions : userQuickActions;
  const promptUser = isAdmin ? 'root' : 'fahad';
  const promptHost = 'fahadcloud';

  return (
    <div className="space-y-4">
      {/* Access Level Badge */}
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Admin Full Access Mode
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
            <Shield className="w-3 h-3" /> User Restricted Mode
          </Badge>
        )}
        <Badge className="bg-slate-100 text-slate-600 border-slate-200">Ubuntu 22.04</Badge>
      </div>

      {/* Ubuntu Terminal */}
      <div className="bg-[#300a24] rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        {/* Terminal Title Bar */}
        <div className="bg-[#380c2a] px-4 py-2 flex items-center gap-2 border-b border-[#4a1240]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#f5a623] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#1aab29] cursor-pointer" />
          </div>
          <span className="text-[#d4d4d4] text-xs font-mono ml-3">{promptUser}@{promptHost}: ~</span>
          <Badge className={cn('ml-auto text-[9px]', isAdmin ? 'bg-red-900/50 text-red-400 border-red-800' : 'bg-emerald-900/50 text-emerald-400 border-emerald-800')}>
            {isAdmin ? 'Admin' : 'User'}
          </Badge>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="p-4 font-mono text-sm leading-relaxed h-[calc(100vh-26rem)] min-h-[300px] max-h-[600px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a1240 transparent' }}
        >
          {/* Welcome Message */}
          {termHistory.length === 0 && (
            <>
              <div className="text-[#4e9a06] font-bold">Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1047-aws x86_64)</div>
              <div className="text-[#06989a] mt-1"> * Documentation:  https://help.ubuntu.com</div>
              <div className="text-[#06989a]"> * Management:     https://landscape.canonical.com</div>
              <div className="text-[#06989a]"> * Support:        https://ubuntu.com/advantage</div>
              <div className="text-[#d4d4d4] mt-2">Last login: {new Date().toLocaleString()}</div>
              {isAdmin ? (
                <div className="text-[#cc0000] mt-1 font-bold">⚠️ ADMIN MODE: You have full server access. Use with caution.</div>
              ) : (
                <div className="text-[#06989a] mt-1">You are in restricted mode. Access limited to your hosting directory.</div>
              )}
              <div className="text-[#d4d4d4] mt-1">Type &apos;help&apos; for available commands.</div>
              <div className={cn('mt-2', isAdmin ? 'text-[#cc0000]' : 'text-[#4e9a06]')}>
                {promptUser}@{promptHost}:~$ 
              </div>
            </>
          )}

          {/* Command History */}
          {termHistory.map((h, i) => (
            <div key={i} className="mb-2">
              <div>
                <span className={isAdmin ? 'text-[#cc0000]' : 'text-[#4e9a06]'}>{promptUser}@{promptHost}</span>
                <span className="text-[#d4d4d4]">:</span>
                <span className="text-[#3465a4]">~</span>
                <span className="text-[#d4d4d4]">$ </span>
                <span className="text-[#d4d4d4]">{h.cmd}</span>
              </div>
              <pre className={cn(
                'whitespace-pre-wrap text-sm',
                h.exitCode === 0 ? 'text-[#d4d4d4]' : 'text-[#cc0000]'
              )}>{h.output}</pre>
            </div>
          ))}

          {/* Running indicator */}
          {termRunning && (
            <div className="text-[#c4a000] animate-pulse">⏳ Executing...</div>
          )}

          {/* Current Input */}
          {!termRunning && (
            <div className="flex items-center">
              <span className={isAdmin ? 'text-[#cc0000]' : 'text-[#4e9a06]'}>{promptUser}@{promptHost}</span>
              <span className="text-[#d4d4d4]">:</span>
              <span className="text-[#3465a4]">~</span>
              <span className="text-[#d4d4d4]">$ </span>
              <input
                className="flex-1 bg-transparent text-[#d4d4d4] font-mono text-sm outline-none border-0 p-0 caret-[#d4d4d4]"
                placeholder=""
                value={termInput}
                onChange={e => setTermInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Monitor className="w-4 h-4 text-emerald-600" />
            Quick Actions
            {isAdmin && <Badge className="bg-red-100 text-red-600 text-[9px]">Admin</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className={cn(
                  'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 h-8 text-xs justify-start gap-1.5',
                  isAdmin && action.label.includes('Nginx') && 'border-red-100 text-red-600 hover:bg-red-50',
                )}
                onClick={() => quickAction(action.cmd)}
                disabled={termRunning}
              >
                <action.icon className="w-3.5 h-3.5 shrink-0" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
