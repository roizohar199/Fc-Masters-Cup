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