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

  return { stats, users, payments, aiStats, loading, loadAdminData, setUsers, setPayments };
}
