export async function earlyRegister(tournamentId: string, userId: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000); // 8s timeout

  try {
    const res = await fetch("/api/early-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, userId }),
      credentials: "include",
      cache: "no-store",
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}
