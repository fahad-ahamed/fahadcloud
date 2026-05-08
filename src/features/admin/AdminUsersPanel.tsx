'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { statusColor } from '@/lib/formatters';

interface AdminUsersPanelProps {
  adminUsers: any[];
  adminLoading: boolean;
}

export default function AdminUsersPanel({
  adminUsers, adminLoading,
}: AdminUsersPanelProps) {
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
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="py-2">{u.firstName} {u.lastName}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2"><Badge className={statusColor(u.role)}>{u.role}</Badge></td>
                    <td className="py-2">৳{u.balance?.toFixed(0)}</td>
                    <td className="py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {adminUsers.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
