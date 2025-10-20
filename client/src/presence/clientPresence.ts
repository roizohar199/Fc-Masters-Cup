/**
 * Client-side presence management with Heartbeat + Beacon
 * 
 * Solves the mobile disconnect issue where users appear online
 * even after closing the browser/app because disconnect events
 * are not reliably sent on mobile devices.
 */

const HEARTBEAT_MS = 20_000;  // Send heartbeat every 20 seconds
const LEAVE_ENDPOINT = "/api/presence/leave";
const BEAT_ENDPOINT = "/api/presence/beat";

let beatTimer: number | null = null;
let currentUserId: string | null = null;
let currentTournamentId: string | null = null;

/**
 * Start presence tracking for a user
 * @param userId - User ID to track
 * @param tournamentId - Optional tournament ID
 */
export function startPresence(userId: string, tournamentId?: string) {
  // Store current state
  currentUserId = userId;
  currentTournamentId = tournamentId || null;

  // Send heartbeat immediately and then every HEARTBEAT_MS
  const beat = async () => {
    if (!currentUserId) return;
    
    try {
      await fetch(BEAT_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json" 
        },
        body: JSON.stringify({ 
          userId: currentUserId, 
          tournamentId: currentTournamentId,
          sessionId: generateSessionId() // Unique per tab/session
        }),
        keepalive: true, // Important for mobile
      });
    } catch (error) {
      console.warn("Presence heartbeat failed:", error);
    }
  };

  // Clean up any existing timer
  stopPresence();
  
  // Start heartbeat
  void beat();
  // @ts-ignore - setInterval returns number in browser
  beatTimer = window.setInterval(beat, HEARTBEAT_MS);

  // Setup leave handlers
  setupLeaveHandlers();
}

/**
 * Stop presence tracking
 */
export function stopPresence() {
  if (beatTimer) {
    // @ts-ignore - clearInterval takes number in browser
    clearInterval(beatTimer);
    beatTimer = null;
  }
  
  // Send leave signal
  if (currentUserId) {
    sendLeaveSignal();
  }
  
  currentUserId = null;
  currentTournamentId = null;
}

/**
 * Send leave signal using sendBeacon (reliable on mobile)
 */
function sendLeaveSignal() {
  if (!currentUserId) return;
  
  try {
    const payload = JSON.stringify({ 
      userId: currentUserId, 
      tournamentId: currentTournamentId, 
      reason: "manual" 
    });
    
    if (navigator.sendBeacon) {
      // Use sendBeacon - most reliable for mobile
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(LEAVE_ENDPOINT, blob);
    } else {
      // Fallback to fetch with keepalive
      fetch(LEAVE_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Ignore errors - this is best effort
      });
    }
  } catch (error) {
    console.warn("Failed to send leave signal:", error);
  }
}

/**
 * Setup event handlers for page unload/visibility changes
 */
function setupLeaveHandlers() {
  // pagehide is more reliable than beforeunload on mobile
  const handleLeave = () => {
    sendLeaveSignal();
  };

  // Page is being hidden (mobile app switch, tab close, etc.)
  window.addEventListener("pagehide", handleLeave, { capture: true });
  
  // Page visibility changes (tab switch, mobile home button, etc.)
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleLeave();
    }
  });

  // Before unload (desktop)
  window.addEventListener("beforeunload", handleLeave);
}

/**
 * Generate a unique session ID for this tab/session
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if presence is currently active
 */
export function isPresenceActive(): boolean {
  return beatTimer !== null && currentUserId !== null;
}

/**
 * Get current user ID being tracked
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Get current tournament ID being tracked
 */
export function getCurrentTournamentId(): string | null {
  return currentTournamentId;
}
