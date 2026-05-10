'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Brain, BookOpen, Search, Lightbulb, TrendingUp, RefreshCw, Plus, Clock, CheckCircle, XCircle, Loader2, Sparkles, ChevronDown, ChevronUp, ExternalLink, FileText, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AILearningPanel() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState('')
  const [creating, setCreating] = useState(false)
  const [depth, setDepth] = useState('standard')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [sessionDetails, setSessionDetails] = useState<Record<string, any>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [autoRefresh, setAutoRefresh] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/learning')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        // Auto-refresh if any session is still in progress
        const hasInProgress = (data.sessions || []).some((s: any) => s.status === 'researching' || s.status === 'analyzing')
        if (hasInProgress) {
          setAutoRefresh('active')
        } else {
          setAutoRefresh(null)
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchSessions() }, [])

  // Auto-refresh every 5 seconds when research is in progress
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchSessions()
      // Also refresh expanded session details
      if (expandedSession && sessionDetails[expandedSession]) {
        loadSessionDetails(expandedSession, true)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, expandedSession])

  const createSession = async () => {
    if (!topic.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/agent/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), depth }),
      })
      if (res.ok) {
        setTopic('')
        fetchSessions()
        // Research started
      }
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  const loadSessionDetails = async (sessionId: string, silent: boolean = false) => {
    if (!silent && sessionDetails[sessionId]) {
      setExpandedSession(expandedSession === sessionId ? null : sessionId)
      return
    }
    if (!silent) setLoadingDetails(prev => ({ ...prev, [sessionId]: true }))
    try {
      const res = await fetch(`/api/agent/learning?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setSessionDetails(prev => ({ ...prev, [sessionId]: data }))
      }
    } catch (e) { console.error(e) }
    if (!silent) setLoadingDetails(prev => ({ ...prev, [sessionId]: false }))
    if (!silent) setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'researching': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse"><Search className="w-3 h-3 mr-1" />Researching</Badge>
      case 'analyzing': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse"><Brain className="w-3 h-3 mr-1" />Analyzing</Badge>
      case 'failed': return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default: return <Badge className="bg-slate-50 text-slate-500">{status}</Badge>
    }
  }

  const getDepthBadge = (d: string) => {
    switch (d) {
      case 'deep': return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Deep</Badge>
      case 'standard': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Standard</Badge>
      case 'quick': return <Badge className="bg-slate-50 text-slate-600 border-slate-200">Quick</Badge>
      default: return null
    }
  }

  // Render findings text - handle both string and JSON formats
  const renderFindings = (findings: any) => {
    if (!findings) return null
    
    let text = ''
    if (typeof findings === 'string') {
      // Try to parse as JSON first (old format stored JSON)
      try {
        const parsed = JSON.parse(findings)
        if (parsed.summary) {
          text = parsed.summary
        } else if (parsed.analysis) {
          text = parsed.analysis
        } else {
          text = findings // Not meaningful JSON, show raw
        }
      } catch {
        // Not JSON - it's plain text (new format), show directly
        text = findings
      }
    } else {
      text = JSON.stringify(findings, null, 2)
    }

    if (!text || text.length < 5) return null

    // Render markdown-like formatting
    return (
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl p-5 text-sm text-slate-700 leading-relaxed max-h-[500px] overflow-y-auto border border-slate-200">
        {text.split('\n').map((line: string, i: number) => {
          const trimmed = line.trim()
          if (!trimmed) return <br key={i} />
          if (trimmed.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" />{trimmed.replace('## ', '')}</h3>
          if (trimmed.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold text-slate-800 mt-3 mb-1">{trimmed.replace('### ', '')}</h4>
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) return <div key={i} className="flex items-start gap-2 ml-2 my-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /><span>{trimmed.replace(/^[-*•]\s*/, '')}</span></div>
          if (/^\d+\.\s/.test(trimmed)) return <div key={i} className="flex items-start gap-2 ml-2 my-1"><span className="text-emerald-600 font-medium shrink-0">{trimmed.match(/^(\d+)\./)?.[1]}.</span><span>{trimmed.replace(/^\d+\.\s*/, '')}</span></div>
          if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <p key={i} className="font-semibold text-slate-800 mt-2">{trimmed.replace(/\*\*/g, '')}</p>
          return <p key={i} className="my-0.5">{trimmed}</p>
        })}
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'best_practice': return <Zap className="w-3.5 h-3.5 text-emerald-500" />
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
      case 'pattern': return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
      case 'fact': return <Lightbulb className="w-3.5 h-3.5 text-purple-500" />
      default: return <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Learning</h2>
          <p className="text-sm text-slate-500 mt-1">Research topics and expand AI knowledge base</p>
        </div>
        <Button onClick={fetchSessions} size="sm" variant="outline" className="gap-1.5 border-slate-200">
          <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />Refresh
        </Button>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><BookOpen className="w-4 h-4 text-blue-600" /></div>
              <div><p className="text-[10px] text-slate-500">Total</p><p className="text-lg font-bold text-slate-900">{sessions.length}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
              <div><p className="text-[10px] text-slate-500">Completed</p><p className="text-lg font-bold text-slate-900">{sessions.filter(s => s.status === 'completed').length}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Brain className="w-4 h-4 text-amber-600" /></div>
              <div><p className="text-[10px] text-slate-500">In Progress</p><p className="text-lg font-bold text-slate-900">{sessions.filter(s => s.status === 'researching' || s.status === 'analyzing').length}</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Start New Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a topic to research (e.g., Kubernetes, Machine Learning, Cloud Security)"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createSession()}
              className="flex-1"
            />
            <Button onClick={createSession} disabled={creating || !topic.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-600 gap-1.5 text-white">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Research
            </Button>
          </div>
          <div className="flex gap-2">
            {['quick', 'standard', 'deep'].map(d => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition',
                  depth === d
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                )}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
          <span className="text-slate-500">Loading learning sessions...</span>
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-1">No research sessions yet</p>
            <p className="text-xs text-slate-400">Start by entering a topic above to begin AI-powered research</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <Card key={session.id} className={cn("bg-white shadow-sm overflow-hidden transition-colors", session.status === 'researching' || session.status === 'analyzing' ? 'border-blue-200' : session.status === 'completed' ? 'border-emerald-200' : session.status === 'failed' ? 'border-red-200' : 'border-slate-200')}>
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => loadSessionDetails(session.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      session.status === 'completed' ? 'bg-emerald-50' : session.status === 'researching' ? 'bg-blue-50' : session.status === 'analyzing' ? 'bg-amber-50' : 'bg-red-50'
                    )}>
                      {session.status === 'researching' ? <Search className="w-5 h-5 text-blue-500 animate-pulse" /> :
                       session.status === 'analyzing' ? <Brain className="w-5 h-5 text-amber-500 animate-pulse" /> :
                       session.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                       <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{session.topic}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(session.status)}
                        {getDepthBadge(session.researchDepth)}
                        <span className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleString()}</span>
                        {session.knowledgeStored > 0 && <span className="text-xs text-emerald-600">{session.knowledgeStored} insights</span>}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {expandedSession === session.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {expandedSession === session.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {loadingDetails[session.id] ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
                        <span className="text-sm text-slate-500">Loading research details...</span>
                      </div>
                    ) : sessionDetails[session.id] ? (
                      <div className="space-y-4">
                        {/* Research Findings - FULL TEXT */}
                        {renderFindings(sessionDetails[session.id].findings)}

                        {/* Key Insights */}
                        {sessionDetails[session.id].insights && sessionDetails[session.id].insights.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                              <Lightbulb className="w-4 h-4 text-amber-500" /> Key Insights ({sessionDetails[session.id].insights.length})
                            </h4>
                            <div className="grid gap-2">
                              {sessionDetails[session.id].insights.map((insight: any, i: number) => (
                                <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-lg border", 
                                  insight.category === 'warning' ? 'bg-amber-50/50 border-amber-200' :
                                  insight.category === 'best_practice' ? 'bg-emerald-50/50 border-emerald-200' :
                                  insight.category === 'pattern' ? 'bg-blue-50/50 border-blue-200' :
                                  'bg-slate-50 border-slate-200'
                                )}>
                                  {getCategoryIcon(insight.category)}
                                  <span className="text-xs text-slate-700 leading-relaxed">{insight.insight || insight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources */}
                        {sessionDetails[session.id].resources && sessionDetails[session.id].resources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-blue-500" /> Sources ({sessionDetails[session.id].resources.length})
                            </h4>
                            <div className="space-y-1">
                              {sessionDetails[session.id].resources.map((res: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                                  <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                                  {res.url ? (
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{res.title || res.url}</a>
                                  ) : (
                                    <span className="text-slate-600 truncate">{res.title || 'AI Analysis'}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state for in-progress sessions */}
                        {!sessionDetails[session.id].findings && !sessionDetails[session.id].insights?.length && (
                          <div className="text-center py-8">
                            {(session.status === 'researching' || session.status === 'analyzing') ? (
                              <>
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                                <p className="text-sm text-slate-600 font-medium">Research in progress...</p>
                                <p className="text-xs text-slate-400 mt-1">This page will auto-refresh. Check back shortly.</p>
                              </>
                            ) : session.status === 'failed' ? (
                              <>
                                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                <p className="text-sm text-red-600">Research failed. Please try again.</p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">No detailed findings available for this session.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">Could not load details</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
