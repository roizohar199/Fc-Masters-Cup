export function nowISO() { return new Date().toISOString(); }
export function genToken(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  return Array.from({length: len}, ()=> chars[Math.floor(Math.random()*chars.length)]).join("");
}
export function genPin() { return genToken(6); }

