/**
 * Safe fetch wrapper that ensures JSON responses and provides clear error messages
 * when the backend returns HTML instead of JSON (common issue with Nginx/SPA routing)
 */
export async function fetchJSON<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  const ct = res.headers.get("content-type") || "";

  // אם הגיע סטטוס שגיאה – קרא טקסט כדי לראות מה באמת חזר (HTML/JSON)
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (ct.includes("application/json")) {
      try {
        const j = JSON.parse(body);
        throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url} | ${j.error || j.message || body}`);
      } catch {
        throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url} | ${body}`);
      }
    }
    // כאן בדרך כלל נקבל '<!doctype html>' – זה מסביר את ה-Unexpected token '<'
    throw new Error(
      `Expected JSON but got ${ct || "unknown"} (HTTP ${res.status}) from ${url}. First 200 chars:\n` +
      body.slice(0, 200)
    );
  }

  if (!ct.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Expected JSON but got ${ct || "unknown"} from ${url}. First 200 chars:\n` + body.slice(0, 200)
    );
  }

  return res.json();
}

