'use client'
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, FolderOpen, Trash2 } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';
import type { User, FileEntry } from '@/types';

interface StorageViewProps {
  user: User;
  files: FileEntry[];
  uploading: boolean;
  storageLoading: boolean;
  onUpload: () => void;
  onDeleteFile: (fileId: string) => void;
}

export default function StorageView({
  user, files, uploading, storageLoading,
  onUpload, onDeleteFile,
}: StorageViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">Storage</h2>
          <p className="text-sm text-slate-500">
            {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)} used
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" onClick={onUpload}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload Files
        </Button>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
          style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }}
        />
      </div>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          {storageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
              <span className="text-slate-500">Loading files...</span>
            </div>
          ) : files.length > 0 ? (
            files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {f.isDirectory ? <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" /> : <FileText className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="text-sm truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{formatBytes(f.size)}</span>
                  <Button variant="ghost" size="sm" className="text-red-400 h-6" onClick={() => onDeleteFile(f.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">No files uploaded yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
