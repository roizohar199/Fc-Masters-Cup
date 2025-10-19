// client/src/utils/rounds.ts
export type Round = 'R16' | 'QF' | 'SF' | 'F';

export function getRoundName(round: Round): string {
  switch (round) {
    case 'R16': return 'שמינית גמר';
    case 'QF':  return 'רבע גמר';
    case 'SF':  return 'חצי גמר';
    case 'F':   return 'גמר';
    default:    return round;
  }
}

