import React from "react";
import "./round16.css";

export type Team = {
  id: string | number;
  name: string;
  short?: string;       // ראשי־תיבות, אם יש
  logoUrl?: string;     // אם קיים לוגו – נשתמש בו
};

export type Match = {
  id: string | number;
  home: Team;
  away: Team;
  status?: "scheduled" | "playing" | "finished";
  note?: string;        // "טרם שוחק" וכו'
};

type Props = {
  matches: Match[];     // חייב להכיל 8 משחקים לשמינית
  title?: string;       // כותרת עליונה
  subtitle?: string;    // כותרת משנה
};

function initials(name: string, fallback?: string) {
  if (fallback && fallback.trim().length <= 3) return fallback.toUpperCase();
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts[1]?.[0] || (parts[0]?.[1] || "");
  return (first + last).toUpperCase();
}

function Crest({ team }: { team: Team }) {
  if (team.logoUrl) {
    return <img className="r16__crest-img" src={team.logoUrl} alt={team.name} loading="lazy" />;
  }
  return (
    <div className="r16__crest-fallback" title={team.name}>
      {initials(team.name, team.short)}
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  return (
    <div className="r16__match">
      <div className="r16__side r16__side--home" dir="rtl">
        <Crest team={m.home} />
        <div className="r16__team-name" title={m.home.name}>
          {m.home.name}
        </div>
      </div>

      <div className="r16__vs">VS</div>

      <div className="r16__side r16__side--away" dir="rtl">
        <div className="r16__team-name r16__team-name--right" title={m.away.name}>
          {m.away.name}
        </div>
        <Crest team={m.away} />
      </div>
    </div>
  );
}

export default function RoundOf16Grid({ matches, title = "FC MASTERS CUP", subtitle = "ROUND OF 16" }: Props) {
  // נחלק לשתי עמודות של 4/4. אם פחות/יותר – נסתדר דינמית.
  const leftCol  = matches.slice(0, 4);
  const rightCol = matches.slice(4, 8);

  return (
    <section className="r16__wrap">
      <header className="r16__header">
        <h1 className="r16__title">{title}</h1>
        <p className="r16__subtitle">{subtitle}</p>
      </header>

      <div className="r16__grid">
        <div className="r16__col">
          {leftCol.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>

        <div className="r16__col">
          {rightCol.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
