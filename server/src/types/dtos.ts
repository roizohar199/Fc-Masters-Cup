// server/src/types/dtos.ts
export interface ApproveMatchBody {
  id: string;
  evidenceHome?: string;
  evidenceAway?: string;
}

export type Round = 'R16' | 'QF' | 'SF' | 'F';

export interface AdvanceStageBody {
  id: string;            // tournamentId
  round: Round;
  createdAt?: string;    // ISO (אופציונלי)
  playerIds?: string[];  // אם יש העברה ידנית
}

export interface AdvancePreviewBody {
  round: Round;
  winners: string[];
  seeds?: Array<{ id: string; seed: number }>;
  idempotencyKey?: string;
}

export interface AdvanceConfirmBody {
  round: Round;
  winners: string[];
  seeds?: Array<{ id: string; seed: number }>;
  idempotencyKey: string;
}

export interface AdvanceRevertBody {
  idempotencyKey: string;
}

export interface ProofUploadBody {
  matchId: string;
  playerRole: string;
}

export interface MatchOverrideBody {
  homeScore: number;
  awayScore: number;
}

