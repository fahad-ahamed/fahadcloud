'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Monitor, HardDrive, Cpu, MemoryStick, Container, RefreshCw,
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
}

export default function TerminalView({
  termHistory, termInput, setTermInput,
  termRunning, onExecute,
}: TerminalViewProps) {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Track command history for up/down arrow navigation
  useEffect(() => {
    if (termHistory.length > 0) {
      const lastCmd = termHistory[termHistory.length - 1].cmd;
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
        setTermInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTermInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setTermInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      // Cancel current command
      setTermInput('');
    }
  }, [onExecute, commandHistory, historyIndex, setTermInput]);

  const quickAction = (cmd: string) => {
    setTermInput(cmd);
    // Auto-execute quick actions
    setTimeout(() => onExecute(), 0);
  };

  return (
    <div className="space-y-4">
      {/* Ubuntu Terminal */}
      <div className="bg-[#300a24] rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        {/* Terminal Title Bar */}
        <div className="bg-[#380c2a] px-4 py-2 flex items-center gap-2 border-b border-[#4a1240]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#f5a623] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#1aab29] cursor-pointer" />
          </div>
          <span className="text-[#d4d4d4] text-xs font-mono ml-3">fahad@fahadcloud: ~</span>
          <Badge className="bg-emerald-900/50 text-emerald-400 border-emerald-800 ml-auto text-[9px]">Ubuntu 22.04</Badge>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="p-4 font-mono text-sm leading-relaxed h-[calc(100vh-22rem)] min-h-[300px] max-h-[600px] overflow-y-auto"
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
              <div className="text-[#d4d4d4] mt-1">Type &apos;help&apos; for available commands.</div>
              <div className="text-[#4e9a06] mt-2">fahad@fahadcloud:~$ </div>
            </>
          )}

          {/* Command History */}
          {termHistory.map((h, i) => (
            <div key={i} className="mb-2">
              <div>
                <span className="text-[#4e9a06]">fahad@fahadcloud</span>
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
              <span className="text-[#4e9a06]">fahad@fahadcloud</span>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { label: 'System Info', cmd: 'uname -a', icon: Monitor },
              { label: 'Docker Status', cmd: 'docker ps', icon: Container },
              { label: 'Disk Usage', cmd: 'df -h', icon: HardDrive },
              { label: 'Memory', cmd: 'free -m', icon: MemoryStick },
              { label: 'Processes', cmd: 'ps aux | head -20', icon: Cpu },
              { label: 'PM2 Status', cmd: 'pm2 list', icon: Monitor },
              { label: 'AI Status', cmd: 'ai-status', icon: RefreshCw },
              { label: 'Uptime', cmd: 'uptime', icon: Monitor },
            ].map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 h-8 text-xs justify-start gap-1.5"
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
