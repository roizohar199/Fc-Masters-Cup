/**
 * React hook for presence management
 * Integrates with the presence system and provides user ID from auth context
 */

import { useEffect } from 'react';
import { startPresence, stopPresence } from '../presence/clientPresence';

interface UsePresenceOptions {
  userId?: string;
  tournamentId?: string;
  enabled?: boolean;
}

/**
 * Hook to manage user presence
 * @param options - Presence configuration
 */
export function usePresence({ 
  userId, 
  tournamentId, 
  enabled = true 
}: UsePresenceOptions) {
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Start presence tracking
    startPresence(userId, tournamentId);

    // Cleanup on unmount or when dependencies change
    return () => {
      stopPresence();
    };
  }, [userId, tournamentId, enabled]);

  return {
    isActive: !!userId && enabled
  };
}
