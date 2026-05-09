'use client'
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Brain, User, AlertTriangle, Send, Loader2, RefreshCw,
  Check, CheckCircle, Clock, XCircle, PanelRightOpen, PanelRightClose, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColor } from '@/lib/formatters';
import type { AgentMessage, AgentTask } from '@/types';

interface AgentChatViewProps {
  agentMessages: AgentMessage[];
  agentInput: string;
  setAgentInput: (v: string) => void;
  agentLoading: boolean;
  agentThinking: boolean;
  agentSuggestions: string[];
  orchestrationPlan: any;
  reasoningChain: any;
  showReasoning: boolean;
  setShowReasoning: (v: boolean) => void;
  activeAgents: string[];
  agentTasks: AgentTask[];
  onSendMessage: (messageOverride?: string) => void;
  onNewChat: () => void;
  onApproveTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onRefreshHistory: () => void;
}

export default function AgentChatView({
  agentMessages, agentInput, setAgentInput,
  agentLoading, agentThinking, agentSuggestions,
  orchestrationPlan, reasoningChain,
  showReasoning, setShowReasoning,
  activeAgents, agentTasks,
  onSendMessage, onNewChat,
  onApproveTask, onCancelTask,
  onRefreshHistory,
}: AgentChatViewProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const renderAgentMessage = (msg: AgentMessage, i: number) => (
    <div
      key={i}
      className={cn(
        'flex gap-3 p-4 rounded-xl',
        msg.role === 'user' ? 'bg-emerald-50 ml-6 sm:ml-12' : msg.role === 'system' ? 'bg-amber-50 mx-2 sm:mx-4' : 'bg-slate-50 mr-2 sm:mr-4'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          msg.role === 'user' ? 'bg-emerald-600' : msg.role === 'system' ? 'bg-yellow-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
        )}
      >
        {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : msg.role === 'system' ? <AlertTriangle className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-1">
          {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'FahadCloud AI'}
        </div>
        <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">{msg.content}</div>
      </div>
    </div>
  );

  const hasActiveTasks = agentTasks.filter(t => ['running', 'planned', 'approved'].includes(t.status)).length > 0;

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      {/* Chat Area - Full Width */}
      <div className={cn(
        'h-full flex flex-col bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300',
        showSidePanel ? 'mr-0 lg:mr-80' : ''
      )}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium">FahadCloud AI</div>
              <div className="text-xs text-emerald-600">Online - Ready to help</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasActiveTasks && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] mr-1">
                {agentTasks.filter(t => ['running', 'planned'].includes(t.status)).length} tasks
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowSidePanel(!showSidePanel)} title="Tasks & Details">
              {showSidePanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onNewChat} title="Start new chat">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {agentMessages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Cloud Engineer</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">I can help you deploy websites, configure domains, install SSL, manage DNS, and more!</p>
              <div className="flex flex-wrap gap-2 justify-center px-4">
                {['Check domain', 'Deploy app', 'Install SSL', 'Check status', 'Create DB', 'Fix server'].map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-xs"
                    onClick={() => onSendMessage(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {agentMessages.map((msg, i) => renderAgentMessage(msg, i))}
          {agentThinking && (
            <div className="flex gap-3 p-4 rounded-xl bg-slate-50 mr-2 sm:mr-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5 py-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 ml-2">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Reasoning Collapsible */}
        {(orchestrationPlan || reasoningChain) && (
          <div className="px-4 py-2 border-t border-emerald-100 bg-emerald-50/30">
            <button className="flex items-center gap-2 text-xs font-medium text-emerald-700 w-full" onClick={() => setShowReasoning(!showReasoning)}>
              <Brain className="w-3 h-3" /> AI Reasoning {showReasoning ? <span>▲</span> : <span>▼</span>}
              {orchestrationPlan && <Badge className="bg-emerald-200 text-emerald-800 text-[9px] ml-auto">{orchestrationPlan.steps?.length || 0} steps</Badge>}
            </button>
            {showReasoning && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {reasoningChain?.thoughts?.map((t: any, i: number) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium mb-1">
                      <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">{t.type}</Badge>
                      <span className="text-slate-400">{(t.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-600">{t.content}</p>
                  </div>
                ))}
                {orchestrationPlan?.steps?.map((s: any) => (
                  <div key={s.id} className={cn('p-2 rounded-lg border text-xs', s.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200')}>
                    <div className="flex items-center gap-2">
                      {s.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                      <span className="font-medium text-slate-700">{s.description}</span>
                      <Badge className="text-[9px] ml-auto">{s.agentId}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Agents Bar */}
        {activeAgents.length > 0 && (
          <div className="px-4 py-1 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Active:</span>
            {activeAgents.map(a => <Badge key={a} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px]">{a}</Badge>)}
          </div>
        )}

        {/* Suggestions */}
        {agentSuggestions.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto">
            {agentSuggestions.map((s, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap shrink-0 h-7 text-xs"
                onClick={() => onSendMessage(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        )}

        {/* Input - Fixed at bottom */}
        <div className="p-3 sm:p-4 border-t border-slate-200 flex gap-2">
          <Input
            className="flex-1 bg-slate-50 border-slate-200 focus:border-emerald-400 text-slate-900"
            placeholder="Ask me anything... (e.g., 'Deploy my React app')"
            value={agentInput}
            onChange={e => setAgentInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSendMessage()}
            disabled={agentLoading}
          />
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4" onClick={() => onSendMessage()} disabled={agentLoading}>
            {agentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Slide-over Panel for Tasks & Details */}
      {showSidePanel && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-slate-200 shadow-lg overflow-y-auto z-10">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tasks & Details</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSidePanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Active Tasks */}
          <div className="p-3 border-b border-slate-100">
            <h4 className="text-xs font-medium text-slate-500 mb-2">Active Tasks</h4>
            {agentTasks.filter(t => ['running', 'planned', 'approved'].includes(t.status)).length === 0 ? (
              <p className="text-xs text-slate-400">No active tasks</p>
            ) : (
              <div className="space-y-2">
                {agentTasks
                  .filter(t => ['running', 'planned', 'approved'].includes(t.status))
                  .map(t => (
                    <div key={t.id} className="p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{t.type}</span>
                        <Badge className={statusColor(t.status)}>{t.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{t.description}</p>
                      {t.totalSteps > 0 && (
                        <div className="mt-1">
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(t.currentStep / t.totalSteps) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400">Step {t.currentStep}/{t.totalSteps}</span>
                        </div>
                      )}
                      {t.status === 'planned' && (
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => onApproveTask(t.id)}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-red-200 text-red-500 flex-1" onClick={() => onCancelTask(t.id)}>Cancel</Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Orchestration Plan */}
          {orchestrationPlan && (
            <div className="p-3 border-b border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 mb-2">Orchestration Plan</h4>
              <div className="space-y-1">
                {orchestrationPlan.steps?.map((s: any) => (
                  <div key={s.id} className={cn('p-1.5 rounded text-xs flex items-center gap-1.5', s.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50')}>
                    {s.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                    <span className="truncate">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning Chain */}
          {reasoningChain && (
            <div className="p-3 border-b border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 mb-2">Reasoning Chain</h4>
              <div className="space-y-1">
                {reasoningChain.thoughts?.map((t: any, i: number) => (
                  <div key={i} className="text-xs p-1.5 bg-slate-50 rounded">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[9px] mr-1">{t.type}</Badge>
                    <span className="text-slate-600">{t.content.substring(0, 100)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Agents */}
          {activeAgents.length > 0 && (
            <div className="p-3 border-b border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 mb-2">Active Agents</h4>
              <div className="flex flex-wrap gap-1">
                {activeAgents.map(a => (
                  <Badge key={a} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tasks */}
          <div className="p-3">
            <h4 className="text-xs font-medium text-slate-500 mb-2">Recent Tasks</h4>
            {agentTasks.length === 0 ? (
              <p className="text-xs text-slate-400">No tasks yet</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {agentTasks.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-slate-50">
                    {t.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : t.status === 'failed' ? <XCircle className="w-3 h-3 text-red-400" /> : <Clock className="w-3 h-3 text-amber-500" />}
                    <span className="text-slate-600 truncate">{t.type}</span>
                    <Badge className={statusColor(t.status) + ' text-[9px] ml-auto'}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
