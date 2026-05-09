'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Globe, DollarSign, Loader2, Activity, Terminal, Brain,
  ShieldAlert, AlertTriangle, Trash2, Shield, RefreshCw, Search, Eye,
  Server, HardDrive, Database, FileText, Folder, File, FolderOpen,
  FileCode, Save, Plus, FolderPlus, Edit3, ChevronRight, ChevronDown,
  Settings, Cpu, Monitor, Zap, Play, RotateCcw, Power, Copy,
  CheckCircle, XCircle, AlertCircle, Send, Mail, Phone, MapPin,
  Building, CreditCard, Lock, Clock, Download, Upload, X, Key,
  Pause, ArrowUpRight, UserPlus, UserX, UserCheck, MoreHorizontal,
  Pencil, ToggleLeft, ToggleRight, Wifi, WifiOff, HardHat, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuperAdminViewProps {
  onNavigate?: (view: string) => void;
}

// ============ FILE EXPLORER TAB ============
function FileManagerTab() {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/files?action=tree');
      const data = await res.json();
      setTree(data.tree || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const openFile = async (filePath: string) => {
    setFileLoading(true);
    try {
      const res = await fetch(`/api/admin/files?action=read&path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedFile(data);
        setFileContent(data.content);
        setEdited(false);
        setCurrentPath(filePath);
      } else { alert(data.error || 'Failed to read file'); }
    } catch {}
    setFileLoading(false);
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', path: currentPath, content: fileContent }),
      });
      const data = await res.json();
      if (res.ok) { setEdited(false); alert('File saved successfully!'); }
      else { alert(data.error || 'Failed to save'); }
    } catch {}
    setSaving(false);
  };

  const createItem = async (type: 'file' | 'folder') => {
    if (!newFileName) return;
    try {
      const basePath = currentPath ? currentPath.split('/').slice(0, -1).join('/') : '';
      const fullPath = basePath ? `${basePath}/${newFileName}` : newFileName;
      const res = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type === 'file' ? 'create_file' : 'create_folder', path: fullPath, content: '' }),
      });
      const data = await res.json();
      if (res.ok) { setShowNewFile(false); setShowNewFolder(false); setNewFileName(''); loadTree(); }
      else { alert(data.error); }
    } catch {}
  };

  const deleteItem = async (filePath: string) => {
    if (!confirm(`Delete ${filePath}? This cannot be undone and affects the LIVE project!`)) return;
    try {
      const res = await fetch(`/api/admin/files?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { if (currentPath === filePath) { setSelectedFile(null); setFileContent(''); setCurrentPath(''); } loadTree(); }
      else { alert(data.error); }
    } catch {}
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const content = await file.text();
      const basePath = currentPath ? currentPath.split('/').slice(0, -1).join('/') : '';
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
      const res = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', path: fullPath, content }),
      });
      if (res.ok) { loadTree(); alert('File uploaded!'); }
    } catch {}
    setUploading(false);
  };

  const getFileIcon = (name: string, type: string) => {
    if (type === 'directory') return expandedPaths.has(name) ? FolderOpen : Folder;
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return FileCode;
    if (['json', 'prisma'].includes(ext || '')) return Database;
    if (['css', 'scss'].includes(ext || '')) return FileText;
    return File;
  };

  const renderTree = (items: any[], depth: number = 0) => {
    return items.map((item) => {
      const Icon = getFileIcon(item.path, item.type);
      const isExpanded = expandedPaths.has(item.path);
      const isSelected = currentPath === item.path;
      return (
        <div key={item.path}>
          <div
            className={cn(
              'flex items-center gap-1.5 py-1 px-2 text-xs cursor-pointer hover:bg-slate-100 rounded transition-colors group',
              isSelected && 'bg-emerald-50 text-emerald-700 font-medium',
              depth === 0 && 'font-medium',
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => { if (item.type === 'directory') toggleExpand(item.path); else openFile(item.path); }}
          >
            {item.type === 'directory' && (isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />)}
            <Icon className={cn('w-3.5 h-3.5 shrink-0', item.type === 'directory' ? 'text-yellow-500' : 'text-slate-400')} />
            <span className="truncate flex-1">{item.name}</span>
            {item.type === 'file' && item.size !== undefined && (
              <span className="text-[9px] text-slate-300 shrink-0">{item.size > 1024 ? `${(item.size / 1024).toFixed(1)}KB` : `${item.size}B`}</span>
            )}
            <button className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5" onClick={(e) => { e.stopPropagation(); deleteItem(item.path); }}>
              <Trash2 className="w-3 h-3 text-slate-300 hover:text-red-500" />
            </button>
          </div>
          {item.type === 'directory' && isExpanded && item.children && renderTree(item.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
      <Card className="bg-white border-slate-200 shadow-sm lg:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5"><Folder className="w-4 h-4 text-yellow-500" /> Project Files</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setShowNewFile(true); setNewFileName(''); }} title="New File"><Plus className="w-3 h-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setShowNewFolder(true); setNewFileName(''); }} title="New Folder"><FolderPlus className="w-3 h-3" /></Button>
              <label className="cursor-pointer"><Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Upload File" disabled={uploading}>{uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}</Button><input type="file" className="hidden" onChange={uploadFile} /></label>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={loadTree} title="Refresh"><RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} /></Button>
            </div>
          </div>
          {showNewFile && (
            <div className="flex gap-1 mt-2">
              <Input placeholder="filename.ts" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && createItem('file')} />
              <Button size="sm" className="h-7 text-xs" onClick={() => createItem('file')}>Create</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowNewFile(false)}><X className="w-3 h-3" /></Button>
            </div>
          )}
          {showNewFolder && (
            <div className="flex gap-1 mt-2">
              <Input placeholder="folder-name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && createItem('folder')} />
              <Button size="sm" className="h-7 text-xs" onClick={() => createItem('folder')}>Create</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowNewFolder(false)}><X className="w-3 h-3" /></Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-1">
          {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : renderTree(tree)}
        </CardContent>
      </Card>
      <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5"><FileCode className="w-4 h-4 text-blue-500" /> {currentPath || 'Select a file'}</CardTitle>
            {currentPath && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText(fileContent)} title="Copy All"><Copy className="w-3 h-3" /></Button>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={saveFile} disabled={!edited || saving}>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save</Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => deleteItem(currentPath)}><Trash2 className="w-3 h-3" /> Delete</Button>
              </div>
            )}
          </div>
          {edited && <p className="text-[10px] text-amber-600 mt-1">Unsaved changes - save to apply to live project</p>}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {fileLoading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> :
            currentPath ? (
              <textarea
                className="w-full h-full font-mono text-xs p-4 bg-slate-950 text-green-400 resize-none outline-none"
                value={fileContent}
                onChange={(e) => { setFileContent(e.target.value); setEdited(true); }}
                spellCheck={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FileCode className="w-12 h-12 mb-2" />
                <p className="text-sm">Select a file from the tree to edit</p>
                <p className="text-xs mt-1">Changes are applied directly to the live project</p>
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DATABASE MANAGER TAB ============
function DatabaseManagerTab() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [editRow, setEditRow] = useState<any>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/database?action=tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch {}
  }, []);

  const loadTableData = useCallback(async (table: string, pg: number = 1) => {
    if (!table) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/database?action=select&table=${table}&page=${pg}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows || []);
        setColumns(data.columns || []);
        setTotalCount(data.total || 0);
      } else { alert(data.error); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);
  useEffect(() => { if (selectedTable) loadTableData(selectedTable, page); }, [selectedTable, page, loadTableData]);

  const executeSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', sql: sqlQuery }),
      });
      const data = await res.json();
      setSqlResult(data);
    } catch (e: any) { setSqlResult({ error: e.message }); }
    setSqlLoading(false);
  };

  const updateRow = async () => {
    if (!selectedTable || !editRow) return;
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', table: selectedTable, id: editRow.id, values: editValues }),
      });
      const data = await res.json();
      if (res.ok) { setEditRow(null); loadTableData(selectedTable, page); alert('Row updated!'); }
      else { alert(data.error); }
    } catch {}
  };

  const insertRow = async () => {
    if (!selectedTable) return;
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', table: selectedTable, values: newRow }),
      });
      const data = await res.json();
      if (res.ok) { setShowAddRow(false); setNewRow({}); loadTableData(selectedTable, page); alert('Row added!'); }
      else { alert(data.error); }
    } catch {}
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Delete this row? This affects the LIVE database!')) return;
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', table: selectedTable, id }),
      });
      const data = await res.json();
      if (res.ok) { loadTableData(selectedTable, page); }
      else { alert(data.error); }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="browse"><Database className="w-3.5 h-3.5 mr-1" /> Browse Data</TabsTrigger>
          <TabsTrigger value="sql"><Terminal className="w-3.5 h-3.5 mr-1" /> SQL Query</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-xs font-medium">Table:</Label>
            <select
              className="text-xs border rounded px-2 py-1.5 bg-white"
              value={selectedTable}
              onChange={(e) => { setSelectedTable(e.target.value); setPage(1); }}
            >
              <option value="">Select table...</option>
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {selectedTable && (
              <>
                <Badge variant="outline" className="text-[10px]">{totalCount} rows</Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddRow(true)}><Plus className="w-3 h-3" /> Add Row</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => loadTableData(selectedTable, page)}><RefreshCw className="w-3 h-3" /> Refresh</Button>
              </>
            )}
          </div>

          {showAddRow && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2"><CardTitle className="text-xs">Add New Row to {selectedTable}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {columns.map(col => (
                  <div key={col} className="flex items-center gap-2">
                    <Label className="text-xs w-32 shrink-0">{col}</Label>
                    <Input className="h-7 text-xs" value={newRow[col] || ''} onChange={(e) => setNewRow(prev => ({ ...prev, [col]: e.target.value }))} placeholder={col} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={insertRow}>Insert</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddRow(false); setNewRow({}); }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {editRow && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2"><CardTitle className="text-xs">Edit Row (ID: {editRow.id})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {columns.map(col => (
                  <div key={col} className="flex items-center gap-2">
                    <Label className="text-xs w-32 shrink-0">{col}</Label>
                    <Input className="h-7 text-xs" value={editValues[col] ?? ''} onChange={(e) => setEditValues(prev => ({ ...prev, [col]: e.target.value }))} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={updateRow}><Save className="w-3 h-3 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditRow(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> :
            selectedTable && rows.length > 0 ? (
              <div className="border rounded-lg overflow-auto max-h-[60vh]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Actions</th>
                      {columns.map(col => <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id || idx} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <button className="text-blue-500 hover:text-blue-700 mr-2" onClick={() => { setEditRow(row); setEditValues({ ...row }); }}>
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button className="text-red-500 hover:text-red-700" onClick={() => deleteRow(row.id)}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                        {columns.map(col => (
                          <td key={col} className="px-3 py-1.5 max-w-[200px] truncate">{String(row[col] ?? '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedTable ? <p className="text-xs text-slate-400 text-center py-4">No data or select a table</p> : <p className="text-xs text-slate-400 text-center py-4">Select a table to browse</p>
          }

          {totalCount > 50 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-slate-500">Page {page} of {Math.ceil(totalCount / 50)}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= Math.ceil(totalCount / 50)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sql" className="space-y-3">
          <Card className="bg-slate-950 border-slate-800">
            <CardContent className="p-3">
              <textarea
                className="w-full h-32 font-mono text-xs text-green-400 bg-transparent resize-none outline-none"
                placeholder="SELECT * FROM User LIMIT 10;"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" className="h-7 text-xs gap-1" onClick={executeSql} disabled={sqlLoading}>
                  {sqlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Execute
                </Button>
              </div>
            </CardContent>
          </Card>
          {sqlResult && (
            <Card className={sqlResult.error ? 'bg-red-50 border-red-200' : 'bg-white'}>
              <CardHeader className="pb-2"><CardTitle className="text-xs">{sqlResult.error ? 'Error' : 'Result'}</CardTitle></CardHeader>
              <CardContent>
                {sqlResult.error ? <p className="text-xs text-red-600">{sqlResult.error}</p> :
                  sqlResult.rows ? (
                    <div className="overflow-auto max-h-[40vh]">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>{Object.keys(sqlResult.rows[0] || {}).map(k => <th key={k} className="px-3 py-2 text-left">{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows.map((row: any, i: number) => (
                            <tr key={i} className="border-t">{Object.values(row).map((v: any, j: number) => <td key={j} className="px-3 py-1.5 max-w-[200px] truncate">{String(v ?? '-')}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-xs text-slate-500">{sqlResult.message || 'Query executed'}</p>
                }
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ USER MANAGEMENT TAB (Full CRUD) ============
function UsersManagementTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'customer', phone: '', balance: 0 });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${search}&page=${page}&limit=20`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const blockUser = async (userId: string) => {
    if (!confirm('Block this user?')) return;
    try {
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'block' }) });
      if (res.ok) { loadUsers(); alert('User blocked'); }
    } catch {}
  };

  const unblockUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'unblock', role: 'customer' }) });
      if (res.ok) { loadUsers(); alert('User unblocked'); }
    } catch {}
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('DELETE this user permanently? This cannot be undone!')) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) { loadUsers(); setSelectedUser(null); alert('User deleted'); }
    } catch {}
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/user-detail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, ...editForm }),
      });
      if (res.ok) { loadUsers(); alert('User updated!'); setSelectedUser(null); }
      else { const data = await res.json(); alert(data.error); }
    } catch {}
    setSaving(false);
  };

  const createUser = async () => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (res.ok) { setShowAddUser(false); setNewUserForm({ email: '', password: '', firstName: '', lastName: '', role: 'customer', phone: '', balance: 0 }); loadUsers(); alert('User created!'); }
      else { alert(data.error); }
    } catch {}
  };

  const changeUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) });
      if (res.ok) { loadUsers(); alert('Role updated!'); }
    } catch {}
  };

  const updateBalance = async (userId: string, balance: number) => {
    try {
      const res = await fetch('/api/admin/user-detail', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, balance }) });
      if (res.ok) { loadUsers(); alert('Balance updated!'); }
    } catch {}
  };

  const resetPassword = async (userId: string) => {
    const newPass = prompt('Enter new password for user:');
    if (!newPass) return;
    try {
      const res = await fetch('/api/admin/user-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset-password', userId, newPassword: newPass }) });
      if (res.ok) alert('Password reset!');
      else { const data = await res.json(); alert(data.error); }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <Input className="h-8 text-xs pl-8 w-64" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Badge variant="outline" className="text-[10px]">{users.length} users</Badge>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAddUser(true)}><UserPlus className="w-3.5 h-3.5" /> Add User</Button>
      </div>

      {showAddUser && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Create New User</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">First Name</Label><Input className="h-7 text-xs" value={newUserForm.firstName} onChange={(e) => setNewUserForm(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div><Label className="text-xs">Last Name</Label><Input className="h-7 text-xs" value={newUserForm.lastName} onChange={(e) => setNewUserForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input className="h-7 text-xs" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Password</Label><Input className="h-7 text-xs" type="password" value={newUserForm.password} onChange={(e) => setNewUserForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input className="h-7 text-xs" value={newUserForm.phone} onChange={(e) => setNewUserForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label className="text-xs">Role</Label><select className="h-7 text-xs border rounded w-full px-2" value={newUserForm.role} onChange={(e) => setNewUserForm(p => ({ ...p, role: e.target.value }))}><option value="customer">Customer</option><option value="admin">Admin</option></select></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs" onClick={createUser}>Create User</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddUser(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedUser && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Edit User: {selectedUser.email}</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedUser(null)}><X className="w-3 h-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">First Name</Label><Input className="h-7 text-xs" value={editForm.firstName || ''} onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div><Label className="text-xs">Last Name</Label><Input className="h-7 text-xs" value={editForm.lastName || ''} onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input className="h-7 text-xs" value={editForm.email || ''} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input className="h-7 text-xs" value={editForm.phone || ''} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label className="text-xs">Balance</Label><Input className="h-7 text-xs" type="number" value={editForm.balance || 0} onChange={(e) => setEditForm(p => ({ ...p, balance: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs">Role</Label><select className="h-7 text-xs border rounded w-full px-2" value={editForm.role || 'customer'} onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}><option value="customer">Customer</option><option value="admin">Admin</option><option value="blocked">Blocked</option></select></div>
              <div><Label className="text-xs">Company</Label><Input className="h-7 text-xs" value={editForm.company || ''} onChange={(e) => setEditForm(p => ({ ...p, company: e.target.value }))} /></div>
              <div><Label className="text-xs">Storage Limit (bytes)</Label><Input className="h-7 text-xs" type="number" value={editForm.storageLimit || 0} onChange={(e) => setEditForm(p => ({ ...p, storageLimit: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={updateUser} disabled={saving}>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Changes</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => resetPassword(selectedUser.id)}><Key className="w-3 h-3" /> Reset Password</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedUser(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Balance</th>
                <th className="px-3 py-2 text-left">Domains</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Last Login</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <select className="text-xs border rounded px-1 py-0.5" value={user.role} onChange={(e) => changeUserRole(user.id, e.target.value)}>
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-6 text-xs w-24" type="number" defaultValue={user.balance} onBlur={(e) => { if (parseFloat(e.target.value) !== user.balance) updateBalance(user.id, parseFloat(e.target.value)); }} />
                  </td>
                  <td className="px-3 py-2">{user.domainCount || 0}</td>
                  <td className="px-3 py-2">
                    <Badge className={cn('text-[10px]', user.isBlocked ? 'bg-red-100 text-red-700' : user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                      {user.isBlocked ? 'Blocked' : user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-blue-100 rounded" onClick={() => { setSelectedUser(user); setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, balance: user.balance, role: user.role, company: user.company, storageLimit: user.storageLimit }); }} title="Edit"><Pencil className="w-3 h-3 text-blue-500" /></button>
                      {user.isBlocked ? (
                        <button className="p-1 hover:bg-green-100 rounded" onClick={() => unblockUser(user.id)} title="Unblock"><UserCheck className="w-3 h-3 text-green-500" /></button>
                      ) : (
                        <button className="p-1 hover:bg-orange-100 rounded" onClick={() => blockUser(user.id)} title="Block"><UserX className="w-3 h-3 text-orange-500" /></button>
                      )}
                      <button className="p-1 hover:bg-red-100 rounded" onClick={() => deleteUser(user.id)} title="Delete"><Trash2 className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ============ DOMAINS MANAGEMENT TAB (Full CRUD) ============
function DomainsManagementTab() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editDomain, setEditDomain] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', userId: '', isFree: false, years: 1 });

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/domains?search=${search}&page=${page}&limit=20`);
      const data = await res.json();
      setDomains(data.domains || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [search, page]);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Delete this domain? This is permanent!')) return;
    try {
      const res = await fetch(`/api/admin/domains?domainId=${domainId}`, { method: 'DELETE' });
      if (res.ok) { loadDomains(); alert('Domain deleted!'); }
    } catch {}
  };

  const addDomain = async () => {
    try {
      const res = await fetch('/api/admin/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDomain) });
      const data = await res.json();
      if (res.ok) { setShowAddDomain(false); setNewDomain({ name: '', userId: '', isFree: false, years: 1 }); loadDomains(); alert('Domain added!'); }
      else { alert(data.error); }
    } catch {}
  };

  const updateDomain = async () => {
    if (!editDomain) return;
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: editDomain.id, ...editForm }),
      });
      if (res.ok) { setEditDomain(null); loadDomains(); alert('Domain updated!'); }
      else { const data = await res.json(); alert(data.error); }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <Input className="h-8 text-xs pl-8 w-64" placeholder="Search domains..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAddDomain(true)}><Plus className="w-3.5 h-3.5" /> Add Domain</Button>
      </div>

      {showAddDomain && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs">Register Domain</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Domain Name</Label><Input className="h-7 text-xs" placeholder="example.com" value={newDomain.name} onChange={(e) => setNewDomain(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">User ID</Label><Input className="h-7 text-xs" value={newDomain.userId} onChange={(e) => setNewDomain(p => ({ ...p, userId: e.target.value }))} /></div>
              <div><Label className="text-xs">Years</Label><Input className="h-7 text-xs" type="number" value={newDomain.years} onChange={(e) => setNewDomain(p => ({ ...p, years: parseInt(e.target.value) || 1 }))} /></div>
              <div className="flex items-end"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newDomain.isFree} onChange={(e) => setNewDomain(p => ({ ...p, isFree: e.target.checked }))} /> Free Domain</label></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs" onClick={addDomain}>Register</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddDomain(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editDomain && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Edit Domain: {editDomain.name}</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditDomain(null)}><X className="w-3 h-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Status</Label><select className="h-7 text-xs border rounded w-full px-2" value={editForm.status || ''} onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}><option value="active">Active</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="pending">Pending</option></select></div>
              <div><Label className="text-xs">Auto Renew</Label><select className="h-7 text-xs border rounded w-full px-2" value={editForm.autoRenew ? 'true' : 'false'} onChange={(e) => setEditForm(p => ({ ...p, autoRenew: e.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></div>
              <div><Label className="text-xs">SSL Enabled</Label><select className="h-7 text-xs border rounded w-full px-2" value={editForm.sslEnabled ? 'true' : 'false'} onChange={(e) => setEditForm(p => ({ ...p, sslEnabled: e.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></div>
              <div><Label className="text-xs">Nameserver 1</Label><Input className="h-7 text-xs" value={editForm.nameserver1 || ''} onChange={(e) => setEditForm(p => ({ ...p, nameserver1: e.target.value }))} /></div>
              <div><Label className="text-xs">Nameserver 2</Label><Input className="h-7 text-xs" value={editForm.nameserver2 || ''} onChange={(e) => setEditForm(p => ({ ...p, nameserver2: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={updateDomain}><Save className="w-3 h-3" /> Save</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditDomain(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">TLD</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">SSL</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Expires</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(d => (
                <tr key={d.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{d.name}</td>
                  <td className="px-3 py-2">{d.tld}</td>
                  <td className="px-3 py-2"><Badge className={cn('text-[10px]', d.status === 'active' ? 'bg-green-100 text-green-700' : d.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{d.status}</Badge></td>
                  <td className="px-3 py-2">{d.sslEnabled ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}</td>
                  <td className="px-3 py-2">{d.user?.email || d.userId?.slice(0, 8)}</td>
                  <td className="px-3 py-2">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-blue-100 rounded" onClick={() => { setEditDomain(d); setEditForm({ status: d.status, autoRenew: d.autoRenew, sslEnabled: d.sslEnabled, nameserver1: d.nameserver1, nameserver2: d.nameserver2 }); }} title="Edit"><Pencil className="w-3 h-3 text-blue-500" /></button>
                      <button className="p-1 hover:bg-red-100 rounded" onClick={() => deleteDomain(d.id)} title="Delete"><Trash2 className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ============ HOSTING MANAGEMENT TAB ============
function HostingManagementTab() {
  const [envs, setEnvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hosting?page=${page}&limit=20`);
      const data = await res.json();
      setEnvs(data.environments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setStats(data.stats || null);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteEnv = async (id: string) => {
    if (!confirm('Delete this hosting environment? This is permanent!')) return;
    try {
      const res = await fetch(`/api/admin/hosting?id=${id}`, { method: 'DELETE' });
      if (res.ok) { loadData(); alert('Hosting environment deleted!'); }
    } catch {}
  };

  const updateEnv = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/hosting', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
      if (res.ok) { loadData(); alert('Updated!'); }
      else { const data = await res.json(); alert(data.error); }
    } catch {}
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.byStatus?.map((s: any, i: number) => (
            <Card key={i} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-slate-500 capitalize">{s.status || 'Unknown'}</p>
                <p className="text-lg font-bold">{s._count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">{envs.length} environments</Badge>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={loadData}><RefreshCw className="w-3 h-3" /> Refresh</Button>
      </div>

      {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Storage</th>
                <th className="px-3 py-2 text-left">SSL</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {envs.map(env => (
                <tr key={env.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-[10px]">{env.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{env.user?.email || '-'}</td>
                  <td className="px-3 py-2">{env.domain?.name || '-'}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{env.planSlug}</Badge></td>
                  <td className="px-3 py-2">
                    <select className="text-xs border rounded px-1 py-0.5" value={env.status} onChange={(e) => updateEnv(env.id, { status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{env.storagePercentage || 0}%</td>
                  <td className="px-3 py-2">{env.sslEnabled ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-blue-100 rounded" onClick={() => { const ns = prompt('New root path:', env.rootPath); if (ns) updateEnv(env.id, { rootPath: ns }); }} title="Edit Path"><Pencil className="w-3 h-3 text-blue-500" /></button>
                      <button className="p-1 hover:bg-red-100 rounded" onClick={() => deleteEnv(env.id)} title="Delete"><Trash2 className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ============ PAYMENTS MANAGEMENT TAB ============
function PaymentsManagementTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?page=${page}&limit=20`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setStats(data.stats || null);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const approvePayment = async (paymentId: string) => {
    try {
      const res = await fetch('/api/admin/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) });
      if (res.ok) { loadData(); alert('Payment approved!'); }
    } catch {}
  };

  const rejectPayment = async (paymentId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      const res = await fetch('/api/admin/payments/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, reason }) });
      if (res.ok) { loadData(); alert('Payment rejected'); }
    } catch {}
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold">${stats.totalAmount || 0}</p></CardContent></Card>
          <Card className="bg-green-50 border-green-200"><CardContent className="p-3 text-center"><p className="text-xs text-green-600">Paid</p><p className="text-lg font-bold text-green-700">${stats.paidAmount || 0}</p></CardContent></Card>
          <Card className="bg-yellow-50 border-yellow-200"><CardContent className="p-3 text-center"><p className="text-xs text-yellow-600">Pending</p><p className="text-lg font-bold text-yellow-700">{stats.pendingCount || 0}</p></CardContent></Card>
          <Card className="bg-red-50 border-red-200"><CardContent className="p-3 text-center"><p className="text-xs text-red-600">Fraud</p><p className="text-lg font-bold text-red-700">{stats.fraudCount || 0}</p></CardContent></Card>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">TrxID</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-[10px]">{p.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{p.user?.email || '-'}</td>
                  <td className="px-3 py-2 font-medium">${p.amount}</td>
                  <td className="px-3 py-2">{p.paymentMethod}</td>
                  <td className="px-3 py-2"><Badge className={cn('text-[10px]', p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')}>{p.status}</Badge></td>
                  <td className="px-3 py-2 font-mono text-[10px]">{p.trxId || '-'}</td>
                  <td className="px-3 py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    {p.status === 'pending' && (
                      <div className="flex gap-1">
                        <button className="p-1 hover:bg-green-100 rounded" onClick={() => approvePayment(p.id)} title="Approve"><CheckCircle className="w-3 h-3 text-green-500" /></button>
                        <button className="p-1 hover:bg-red-100 rounded" onClick={() => rejectPayment(p.id)} title="Reject"><XCircle className="w-3 h-3 text-red-500" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ============ SYSTEM CONTROL TAB ============
function SystemControlTab() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState('fahadcloud');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system?action=status');
      const data = await res.json();
      setStatus(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async (service: string) => {
    try {
      const res = await fetch(`/api/admin/system?action=logs&service=${service}&lines=100`);
      const data = await res.json();
      setLogs(data.logs || 'No logs');
    } catch {}
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const systemAction = async (action: string) => {
    if (!confirm(`Execute: ${action}? This affects the LIVE system!`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) { alert(data.message || 'Action executed'); loadStatus(); }
      else { alert(data.error || 'Failed'); }
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* System Stats */}
      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" /><span className="text-xs text-slate-500">CPU</span></div>
              <p className="text-lg font-bold">{status.cpu?.loadAvg?.[0]?.toFixed(2) || '-'}</p>
              <p className="text-[10px] text-slate-400">{status.cpu?.cores} cores</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2"><Monitor className="w-4 h-4 text-purple-500" /><span className="text-xs text-slate-500">Memory</span></div>
              <p className="text-lg font-bold">{status.memory?.percentage || 0}%</p>
              <p className="text-[10px] text-slate-400">{((status.memory?.used || 0) / 1073741824).toFixed(1)} / {((status.memory?.total || 0) / 1073741824).toFixed(1)} GB</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-orange-500" /><span className="text-xs text-slate-500">Disk</span></div>
              <p className="text-sm font-mono">{status.disk || 'N/A'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2"><Server className="w-4 h-4 text-green-500" /><span className="text-xs text-slate-500">Uptime</span></div>
              <p className="text-lg font-bold">{((status.uptime || 0) / 3600).toFixed(1)}h</p>
              <p className="text-[10px] text-slate-400">Node {status.nodeVersion}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service Status & Controls */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Server className="w-4 h-4 text-blue-500" /> Service Controls</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => systemAction('restart_app')} disabled={actionLoading}><RotateCcw className="w-3 h-3" /> Restart App</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => systemAction('rebuild_app')} disabled={actionLoading}><Wrench className="w-3 h-3" /> Rebuild App</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => systemAction('restart_nginx')} disabled={actionLoading}><Power className="w-3 h-3" /> Restart Nginx</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => systemAction('clear_cache')} disabled={actionLoading}><Trash2 className="w-3 h-3" /> Clear Cache</Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Viewer */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-yellow-500" /> System Logs</CardTitle>
            <div className="flex gap-1">
              {['fahadcloud', 'nginx-access', 'nginx-error'].map(s => (
                <Button key={s} variant={selectedLog === s ? 'default' : 'outline'} size="sm" className="h-6 text-[10px]" onClick={() => { setSelectedLog(s); loadLogs(s); }}>{s}</Button>
              ))}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => loadLogs(selectedLog)}><RefreshCw className="w-3 h-3" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-950 text-green-400 text-[10px] p-3 rounded-lg max-h-[40vh] overflow-auto font-mono">{logs || 'Select a log source and click refresh'}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ ACTIVITY LOG TAB ============
function ActivityLogTab() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?limit=200&category=${filter}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Filter:</Label>
        {['all', 'auth', 'domains', 'hosting', 'payments', 'terminal', 'ai'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="h-6 text-[10px] capitalize" onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={loadActivities}><RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} /></Button>
      </div>

      {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <div className="space-y-1 max-h-[65vh] overflow-auto">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded text-xs">
              <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 w-28 shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
              <Badge variant="outline" className="text-[9px] shrink-0">{a.category}</Badge>
              <span className="font-medium">{a.userEmail || 'System'}</span>
              <span className="text-slate-500">{a.action}</span>
              {a.details && <span className="text-slate-400 truncate">{a.details}</span>}
            </div>
          ))}
          {activities.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No activity found</p>}
        </div>
      )}
    </div>
  );
}

// ============ MAIN SUPER ADMIN VIEW ============
export default function SuperAdminView({ onNavigate }: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const statCards = stats ? [
    { label: 'Total Users', value: stats.overview?.totalUsers || stats.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Domains', value: stats.overview?.totalDomains || stats.totalDomains || 0, icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Hosting Env', value: stats.overview?.totalHosting || stats.totalHosting || 0, icon: Server, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Revenue', value: `$${stats.overview?.totalRevenue || stats.totalRevenue || 0}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending Payments', value: stats.overview?.pendingPayments || stats.pendingPayments || 0, icon: CreditCard, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'AI Sessions', value: stats.overview?.totalAgentSessions || stats.totalAgentSessions || 0, icon: Brain, color: 'text-violet-500', bg: 'bg-violet-50' },
  ] : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          Super Admin Panel
        </h2>
        <Badge className="bg-red-100 text-red-700 text-xs">FULL ACCESS</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-slate-100 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="text-xs gap-1"><LayoutDashboard className="w-3.5 h-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
          <TabsTrigger value="domains" className="text-xs gap-1"><Globe className="w-3.5 h-3.5" />Domains</TabsTrigger>
          <TabsTrigger value="hosting" className="text-xs gap-1"><Server className="w-3.5 h-3.5" />Hosting</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs gap-1"><CreditCard className="w-3.5 h-3.5" />Payments</TabsTrigger>
          <TabsTrigger value="files" className="text-xs gap-1"><Folder className="w-3.5 h-3.5" />Files</TabsTrigger>
          <TabsTrigger value="database" className="text-xs gap-1"><Database className="w-3.5 h-3.5" />Database</TabsTrigger>
          <TabsTrigger value="system" className="text-xs gap-1"><Settings className="w-3.5 h-3.5" />System</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1"><Activity className="w-3.5 h-3.5" />Activity</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1 overflow-auto">
          <TabsContent value="dashboard">
            {loading ? <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {statCards.map((s, i) => (
                    <Card key={i} className={`${s.bg} border-0 shadow-sm`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><s.icon className={`w-5 h-5 ${s.color}`} /><span className="text-xs text-slate-500">{s.label}</span></div>
                        <p className="text-2xl font-bold">{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('users')}><UserPlus className="w-3 h-3" /> Manage Users</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('domains')}><Globe className="w-3 h-3" /> Manage Domains</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('files')}><Folder className="w-3 h-3" /> File Manager</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('database')}><Database className="w-3 h-3" /> Database</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('system')}><Settings className="w-3 h-3" /> System</Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setActiveTab('payments')}><CreditCard className="w-3 h-3" /> Payments</Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
                    <CardContent><ActivityLogTab /></CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="users"><UsersManagementTab /></TabsContent>
          <TabsContent value="domains"><DomainsManagementTab /></TabsContent>
          <TabsContent value="hosting"><HostingManagementTab /></TabsContent>
          <TabsContent value="payments"><PaymentsManagementTab /></TabsContent>
          <TabsContent value="files"><FileManagerTab /></TabsContent>
          <TabsContent value="database"><DatabaseManagerTab /></TabsContent>
          <TabsContent value="system"><SystemControlTab /></TabsContent>
          <TabsContent value="activity"><ActivityLogTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

