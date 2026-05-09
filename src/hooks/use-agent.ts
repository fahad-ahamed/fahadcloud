'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '@/services/api';
import type { AgentMessage, AgentTask, AgentDefinition } from '@/types';

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [allAgents, setAllAgents] = useState<AgentDefinition[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [orchestrationPlan, setOrchestrationPlan] = useState<any>(null);
  const [reasoningChain, setReasoningChain] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (messageOverride?: string) => {
    const msgText = messageOverride || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setLoading(true);
    setThinking(true);

    const userMsg: AgentMessage = { role: 'user', content: msgText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const data = await apiClient.sendAgentMessage(msgText, sessionId);
      if (data.sessionId) setSessionId(data.sessionId);

      const aiMsg: AgentMessage = { role: 'assistant', content: data.message, timestamp: new Date().toISOString(), toolCalls: data.actions };
      setMessages(prev => [...prev, aiMsg]);
      setSuggestions(data.suggestions || []);
      if (data.activeAgents) setActiveAgents(data.activeAgents);
      if (data.orchestrationPlan) setOrchestrationPlan(data.orchestrationPlan);
      if (data.reasoningChain) setReasoningChain(data.reasoningChain);
      if (data.tasks?.length > 0) loadHistory();
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error: ' + e.message, timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
    setThinking(false);
  }, [input, loading, sessionId]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiClient.getAgentHistory();
      setTasks(data.tasks || []);
    } catch {}
  }, []);

  const loadSystem = useCallback(async () => {
    try {
      const data = await apiClient.getAgentSystem();
      setAllAgents(data.agents || []);
    } catch {}
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId('');
    setSuggestions([]);
    setOrchestrationPlan(null);
    setReasoningChain(null);
    setActiveAgents([]);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return {
    messages, input, setInput, loading, thinking, sessionId, suggestions, tasks, allAgents,
    activeAgents, orchestrationPlan, reasoningChain, chatEndRef,
    sendMessage, loadHistory, loadSystem, startNewChat,
    setMessages, setSessionId, setSuggestions, setOrchestrationPlan, setReasoningChain, setActiveAgents, setAllAgents, setTasks,
  };
}
