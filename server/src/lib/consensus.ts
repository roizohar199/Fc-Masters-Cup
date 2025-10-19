import db from "../db.js";

export function applySubmission(matchId: string) {
  const subs = db.prepare(`SELECT scoreHome,scoreAway,pin FROM submissions WHERE matchId=? ORDER BY createdAt ASC`).all(matchId) as any[];
  if (subs.length < 2) return { status: "PENDING" } as const;
  const [s1, s2] = subs.slice(-2) as any[]; // use the two most recent
  if (s1.pin !== s2.pin) return { status: "DISPUTED", reason: "PIN mismatch" } as const;
  if (s1.scoreHome === s2.scoreHome && s1.scoreAway === s2.scoreAway) {
    db.prepare(`UPDATE matches SET homeScore=?, awayScore=?, status='CONFIRMED' WHERE id=?`).run(s1.scoreHome, s1.scoreAway, matchId);
    return { status: "CONFIRMED" } as const;
  }
  return { status: "DISPUTED", reason: "Score mismatch" } as const;
}

