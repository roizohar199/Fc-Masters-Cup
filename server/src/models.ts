import { z } from "zod";

export const ISODate = z.string().regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:.+/);

export const Player = z.object({
  id: z.string().uuid(),
  psn: z.string().min(2),
  displayName: z.string().min(2),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});
export type Player = z.infer<typeof Player>;

export const Tournament = z.object({
  id: z.string().uuid(),
  title: z.string().min(2),
  game: z.enum(["FC25", "FC26"]),
  platform: z.literal("PS5"),
  timezone: z.string().default("Asia/Jerusalem"),
  createdAt: ISODate,
  prizeFirst: z.number().int().nonnegative(),
  prizeSecond: z.number().int().nonnegative(),
  nextTournamentDate: z.string().optional(),
  telegramLink: z.string().optional(),
});
export type Tournament = z.infer<typeof Tournament>;

export const Match = z.object({
  id: z.string().uuid(),
  tournamentId: z.string().uuid(),
  round: z.enum(["R16","QF","SF","F"]),
  homeId: z.string().uuid(),
  awayId: z.string().uuid(),
  homeScore: z.number().int().nullable(),
  awayScore: z.number().int().nullable(),
  status: z.enum(["PENDING","CONFIRMED","DISPUTED"]).default("PENDING"),
  token: z.string().length(12),        // private submission token
  pin: z.string().length(6),           // short human PIN displayed to both players
  evidenceHome: z.string().nullable(), // path/URL to screenshot
  evidenceAway: z.string().nullable(),
  createdAt: ISODate
});
export type Match = z.infer<typeof Match>;

export const Submission = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  reporterPsn: z.string(),
  scoreHome: z.number().int().min(0),
  scoreAway: z.number().int().min(0),
  pin: z.string().length(6),
  evidencePath: z.string().optional(),
  createdAt: ISODate
});
export type Submission = z.infer<typeof Submission>;

export const CreateTournamentDTO = z.object({
  title: z.string().min(2),
  game: z.enum(["FC25","FC26"]),
  prizeFirst: z.number().int().nonnegative(),
  prizeSecond: z.number().int().nonnegative(),
  nextTournamentDate: z.string().optional(),
  telegramLink: z.string().optional(),
});

export const SeedPlayersDTO = z.object({
  tournamentId: z.string().uuid(),
  players: z.array(z.object({ id: z.string().uuid(), psn: z.string(), displayName: z.string()})).length(16)
});

export const SubmitResultDTO = z.object({
  scoreHome: z.number().int().min(0),
  scoreAway: z.number().int().min(0),
  reporterPsn: z.string(),
  pin: z.string().length(6),
});

export const RegisterDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  psnUsername: z.string().min(1).optional(),
});

export const ForgotPasswordDTO = z.object({
  email: z.string().email(),
});

export const ResetPasswordDTO = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
  email: z.string().email().optional(),
});

