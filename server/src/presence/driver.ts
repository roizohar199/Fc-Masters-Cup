export interface PresenceDriver {
  beat(userId: string, sessionId?: string, tournamentId?: string): Promise<void>;
  leave(userId: string, sessionId?: string): Promise<void>;
  onlineUsers(): Promise<string[]>;
}

export function envDriver(): "redis" | "memory" {
  const d = (process.env.PRESENCE_DRIVER || "redis").toLowerCase();
  return d === "memory" ? "memory" : "redis";
}

