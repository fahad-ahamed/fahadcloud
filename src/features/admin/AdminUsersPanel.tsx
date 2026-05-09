'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserX, UserCheck, Trash2 } from 'lucide-react';
import { statusColor } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AdminUsersPanelProps {
  adminUsers: any[];
  adminLoading: boolean;
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export default function AdminUsersPanel({
  adminUsers, adminLoading,
  onBlockUser, onUnblockUser, onDeleteUser,
}: AdminUsersPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Users</CardTitle>
      </CardHeader>
      <CardContent>
        {adminLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
            <span className="text-slate-500">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Balance</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u: any) => (
                  <tr key={u.id} className={cn('border-t border-slate-100', u.isBlocked && 'bg-red-50/50')}>
                    <td className="py-2">{u.firstName} {u.lastName}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2"><Badge className={statusColor(u.role)}>{u.role}</Badge></td>
                    <td className="py-2">৳{u.balance?.toFixed(0)}</td>
                    <td className="py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {u.email === 'admin@fahadcloud.com' ? (
                        <span className="text-slate-400 text-xs">Super Admin</span>
                      ) : (
                        <div className="flex gap-1">
                          {u.isBlocked ? (
                            <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => onUnblockUser?.(u.id)}>
                              <UserCheck className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] border-amber-200 text-amber-600" onClick={() => onBlockUser?.(u.id)}>
                              <UserX className="w-3 h-3" />
                            </Button>
                          )}
                          {confirmDelete === u.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-6 text-[10px] bg-red-600 hover:bg-red-700" onClick={() => { onDeleteUser?.(u.id); setConfirmDelete(null); }}>Yes</Button>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setConfirmDelete(null)}>No</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] border-red-200 text-red-500" onClick={() => setConfirmDelete(u.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {adminUsers.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
