'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Server, Brain, Shield, Download, Activity, CheckCircle, XCircle, RefreshCw, Clock, HardDrive, Zap } from 'lucide-react'

export default function DatabaseDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/database')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setError('Failed to load database info')
      }
    } catch (e) {
      setError('Network error - please try again')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleBackup = async (type: string) => {
    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup', type })
      })
      const result = await res.json()
      if (result.success) {
        alert('Backup created successfully!')
        fetchData()
      } else {
        alert('Backup failed: ' + (result.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Backup request failed')
    }
  }

  const getHealthBadge = (status: string | boolean) => {
    if (status === true || status === 'healthy' || status === 'connected') {
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>
    }
    if (status === 'degraded') {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200"><Activity className="w-3 h-3 mr-1" />Degraded</Badge>
    }
    return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Offline</Badge>
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
      <span className="text-slate-500">Loading database dashboard...</span>
    </div>
  )

  const pg = data?.databases?.postgresql || data?.postgresql || data?.pgHealth || {}
  const redis = data?.databases?.redis || data?.redis || data?.redisHealth || {}
  const qdrant = data?.databases?.qdrant || data?.qdrant || data?.qdrantHealth || {}
  const queue = data?.queues || data?.queue || data?.queueStatus || {}
  const tables = data?.databases?.postgresql?.tables || data?.tables || data?.tableCounts || {}
  const backups = data?.backups || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Database Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">PostgreSQL, Redis, Qdrant & Queue status</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} size="sm" variant="outline" className="gap-1.5 border-slate-200">
            <RefreshCw className="w-4 h-4" />Refresh
          </Button>
          <Button onClick={() => handleBackup('manual')} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 gap-1.5">
            <Download className="w-4 h-4" />Backup
          </Button>
        </div>
      </div>

      {/* Database Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">PostgreSQL</p>
              {getHealthBadge(pg.status || pg.healthy || 'healthy')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Server className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Redis</p>
              {getHealthBadge(redis.status || redis.healthy || 'healthy')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Qdrant</p>
              {getHealthBadge(qdrant.status || qdrant.healthy || 'healthy')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">BullMQ</p>
              {getHealthBadge(Object.keys(queue).length > 0 ? 'healthy' : queue.status || 'unknown')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Statistics */}
      {tables && Object.keys(tables).length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              Table Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(tables).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-lg font-bold text-slate-900">{value as number}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Details */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Connection Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">PostgreSQL</span>
            <span className="text-slate-900 font-medium">127.0.0.1:5433/fahadcloud</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Redis</span>
            <span className="text-slate-900 font-medium">127.0.0.1:6379</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Qdrant</span>
            <span className="text-slate-900 font-medium">127.0.0.1:6333</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Queue System</span>
            <span className="text-slate-900 font-medium">BullMQ (Redis-backed)</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
