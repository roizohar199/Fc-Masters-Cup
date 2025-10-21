export async function selectTournamentParticipants(tournamentId: number, userIds: number[]) {
  const r = await fetch(`/api/tournaments/${tournamentId}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userIds })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
