'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';

export function useMonitoring() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    try { const result = await apiClient.getMonitoring(); setData(result); } catch {}
    setLoading(false);
  }, []);

  return { data, loading, loadMonitoring };
}
