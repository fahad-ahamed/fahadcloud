'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';

export function useAdmin() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, paymentsData, aiStatsData] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminUsers(),
        apiClient.getAdminPayments(),
        apiClient.getAdminAiStats(),
      ]);
      const overview = statsData.overview || statsData;
      setStats({ ...statsData, overview });
      setUsers(usersData.users || usersData || []);
      setPayments(paymentsData.payments || paymentsData || []);
      setAiStats(aiStatsData);
    } catch {}
    setLoading(false);
  }, []);

  const blockUser = useCallback(async (userId: string) => {
    const result = await apiClient.blockUser(userId);
    // Update local state
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'blocked', isBlocked: true } : u));
    return result;
  }, []);

  const unblockUser = useCallback(async (userId: string, role?: string) => {
    const result = await apiClient.unblockUser(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role || 'customer', isBlocked: false } : u));
    return result;
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    const result = await apiClient.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    return result;
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: string, adminRole?: string) => {
    const result = await apiClient.updateUserRole({ userId, role, adminRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, adminRole: adminRole ?? u.adminRole } : u));
    return result;
  }, []);

  return {
    stats, users, payments, aiStats, loading,
    loadAdminData, setUsers, setPayments,
    blockUser, unblockUser, deleteUser, updateUserRole,
  };
}
