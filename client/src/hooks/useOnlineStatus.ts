/**
 * React hook for fetching online status
 * Polls the server for online users and provides real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { apiUrl } from '../config/api';

interface OnlineStatus {
  onlineUsers: string[];
  total: number;
  totalSessions: number;
  ttlMs: number;
  lastUpdated: number;
}

interface UseOnlineStatusOptions {
  pollInterval?: number; // milliseconds
  enabled?: boolean;
}

/**
 * Hook to get online user status
 * @param options - Configuration options
 */
export function useOnlineStatus({ 
  pollInterval = 10000, // 10 seconds
  enabled = true 
}: UseOnlineStatusOptions = {}) {
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnlineStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api(apiUrl('/admin/users/online-status'));
      setOnlineStatus(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch online status';
      setError(errorMessage);
      console.error('Failed to fetch online status:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetchOnlineStatus();
  }, [fetchOnlineStatus]);

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;

    const interval = setInterval(fetchOnlineStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchOnlineStatus, pollInterval, enabled]);

  // Helper function to check if a user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineStatus?.onlineUsers.includes(userId) ?? false;
  }, [onlineStatus]);

  return {
    onlineStatus,
    loading,
    error,
    isUserOnline,
    refetch: fetchOnlineStatus
  };
}
