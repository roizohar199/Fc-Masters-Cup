import { describe, it, expect, beforeAll } from "vitest";
import db from "../src/db.js";
import { generateRoundOf16, advanceWinners } from "../src/lib/bracket.js";
import { uuid } from "../src/db.js";
import { nowISO } from "../src/lib/util.js";

describe("bracket generator", ()=>{
  beforeAll(()=>{
    // clear matches
    db.exec("DELETE FROM matches;");
  });
  it("creates 8 matches for R16 and advances properly", ()=>{
    const tId = uuid();
    db.prepare(`INSERT INTO tournaments (id,title,game,platform,timezone,createdAt,prizeFirst,prizeSecond) VALUES (?,?,?,?,?,?,?,?)`)
      .run(tId, "Test", "FC25", "PS5", "Asia/Jerusalem", nowISO(), 1000, 500);
    const pIds = Array.from({length:16}, ()=> uuid());
    const ids = generateRoundOf16(tId, pIds);
    expect(ids.length).toBe(8);

    // confirm winners for 8 matches to enable advance
    const rows = db.prepare(`SELECT id,homeId,awayId FROM matches WHERE tournamentId=? AND round='R16'`).all(tId);
    for (const r of rows) {
      db.prepare(`UPDATE matches SET homeScore=?, awayScore=?, status='CONFIRMED' WHERE id=?`).run(2,1,r.id);
    }
    const qf = advanceWinners(tId, "R16");
    expect(qf.length).toBe(4);
  });
});

