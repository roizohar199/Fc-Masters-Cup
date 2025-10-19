import { describe, it, expect, beforeEach } from "vitest";
import db from "../src/db.js";
import { uuid } from "../src/db.js";
import { nowISO } from "../src/lib/util.js";
import { applySubmission } from "../src/lib/consensus.js";

describe("double report consensus", ()=>{
  beforeEach(()=>{ db.exec("DELETE FROM matches; DELETE FROM submissions;"); });

  it("confirms when two equal submissions + same PIN", ()=>{
    const mId = uuid();
    db.prepare(`INSERT INTO matches (id,tournamentId,round,homeId,awayId,homeScore,awayScore,status,token,pin,evidenceHome,evidenceAway,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(mId, uuid(), "R16", uuid(), uuid(), null, null, "PENDING", "TOKEN123456", "ABC123", null, null, nowISO());
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn1", 3, 1, "ABC123", undefined, nowISO());
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn2", 3, 1, "ABC123", undefined, nowISO());
    const res = applySubmission(mId);
    expect(res.status).toBe("CONFIRMED");
  });

  it("disputes on score mismatch or PIN mismatch", ()=>{
    const mId = uuid();
    db.prepare(`INSERT INTO matches (id,tournamentId,round,homeId,awayId,homeScore,awayScore,status,token,pin,evidenceHome,evidenceAway,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(mId, uuid(), "R16", uuid(), uuid(), null, null, "PENDING", "TOKEN123456", "PIN999", null, null, nowISO());

    // pin mismatch
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn1", 2, 2, "PIN999", undefined, nowISO());
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn2", 2, 2, "PIN111", undefined, nowISO());
    const a = applySubmission(mId);
    expect(a.status).toBe("DISPUTED");

    // score mismatch
    db.exec("DELETE FROM submissions;");
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn1", 2, 1, "PIN999", undefined, nowISO());
    db.prepare(`INSERT INTO submissions (id,matchId,reporterPsn,scoreHome,scoreAway,pin,evidencePath,createdAt) VALUES (?,?,?,?,?,?,?,?)`)
      .run(uuid(), mId, "psn2", 1, 2, "PIN999", undefined, nowISO());
    const b = applySubmission(mId);
    expect(b.status).toBe("DISPUTED");
  });
});

