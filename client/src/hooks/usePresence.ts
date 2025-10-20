/**
 * React hook for presence management
 * Integrates with the presence system and provides user ID from auth context
 */

import { useEffect } from 'react';
import { startPresence, stopPresence } from '../presence/clientPresence';

interface UsePresenceOptions {
  userId?: string;
  tournamentId?: string;
  sessionId?: string;
  enabled?: boolean;
}

/**
 * Hook to manage user presence
 * @param options - Presence configuration
 */
export function usePresence({ 
  userId, 
  tournamentId, 
  sessionId,
  enabled = true 
}: UsePresenceOptions) {
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Start presence tracking
    startPresence(userId, tournamentId, sessionId);

    // Cleanup on unmount or when dependencies change
    return () => {
      stopPresence();
    };
  }, [userId, tournamentId, sessionId, enabled]);

  return {
    isActive: !!userId && enabled
  };
}
