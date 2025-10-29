// client/src/lib/api.ts
export async function postJSON<T>(
  url: string,
  body: unknown,
  { timeoutMs = 12000 }: { timeoutMs?: number } = {}
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function apiGet<T>(
  url: string,
  { timeoutMs = 12000 }: { timeoutMs?: number } = {}
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function apiPatch<T>(
  url: string,
  body: unknown,
  { timeoutMs = 12000 }: { timeoutMs?: number } = {}
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPatch("/me/notifications/mark-all-read", {});
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => t = setTimeout(() => rej(new Error("Request timeout")), ms));
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

export async function apiPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await withTimeout(fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }));
  if (!res.ok) {
    let msg = `POST ${path} failed: ${res.status}`;
    try { const j = await res.json(); msg += ` ${JSON.stringify(j)}`; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<TRes>;
}

// שימוש ייעודי למסלול:
export type EarlyRegisterReq = { 
  tournamentId?: string | number; // ⬅️ אופציונלי - אם חסר, השרת יפתור אוטומטית
  slug?: string; // ⬅️ אופציונלי - אם יש slug
}; // ⬅️ userId לא נדרש מצד הלקוח - מגיע אוטומטית מה-cookie
export type EarlyRegisterRes =
  | { ok: true; registrationId: string; status: string; state?: string; updated?: boolean }
  | { ok: false; error: string };

let inFlightEarlyRegister = false;
export async function earlyRegister(payload: EarlyRegisterReq): Promise<EarlyRegisterRes> {
  if (inFlightEarlyRegister) {
    return Promise.reject(new Error("Early-register already in progress"));
  }
  inFlightEarlyRegister = true;
  try {
    return await apiPost<EarlyRegisterReq, EarlyRegisterRes>("/early-register", payload);
  } finally {
    inFlightEarlyRegister = false;
  }
}