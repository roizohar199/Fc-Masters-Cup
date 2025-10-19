import db from "../db.js";
import { uuid, genToken, genPin } from "../utils/ids.js";
import { nowISO } from "./util.js";

export type Round = "R16"|"QF"|"SF"|"F";

export function generateRoundOf16(tournamentId: string, playerIds: string[]) {
  if (playerIds.length !== 16) throw new Error("Need 16 players to start Round of 16");
  const pairs = [] as Array<[string,string]>;
  for (let i=0;i<16;i+=2) pairs.push([playerIds[i], playerIds[i+1]]);
  const insert = db.prepare(`INSERT INTO matches (id,tournamentId,round,homeId,awayId,homeScore,awayScore,status,token,pin,evidenceHome,evidenceAway,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const ids: string[] = [];
  for (const [homeId, awayId] of pairs) {
    const id = uuid(); ids.push(id);
    insert.run(id, tournamentId, "R16", homeId, awayId, null, null, "PENDING", genToken(), genPin(), null, null, nowISO());
  }
  return ids;
}

export function advanceWinners(tournamentId: string, round: Round) {
  const order = ["R16","QF","SF","F"] as Round[];
  const nextRound = order[order.indexOf(round)+1];
  if (!nextRound) return [] as string[];

  const completed = db.prepare(`SELECT id,homeId,awayId,homeScore,awayScore FROM matches WHERE tournamentId=? AND round=? AND status='CONFIRMED' ORDER BY createdAt ASC`).all(tournamentId, round) as any[];
  if (completed.length % 2 !== 0) throw new Error("Round must have even number of confirmed matches");

  const insert = db.prepare(`INSERT INTO matches (id,tournamentId,round,homeId,awayId,homeScore,awayScore,status,token,pin,evidenceHome,evidenceAway,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const ids: string[] = [];
  for (let i=0;i<completed.length;i+=2) {
    const a: any = completed[i]; const b: any = completed[i+1];
    const aWinner = (a.homeScore! > a.awayScore!) ? a.homeId : a.awayId;
    const bWinner = (b.homeScore! > b.awayScore!) ? b.homeId : b.awayId;
    const id = uuid(); ids.push(id);
    insert.run(id, tournamentId, nextRound, aWinner, bWinner, null, null, "PENDING", genToken(), genPin(), null, null, nowISO());
  }
  return ids;
}

