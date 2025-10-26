export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body != null;
  const res = await fetch(url, {
    credentials: "include",
    headers: { 
      ...(hasBody && { "Content-Type": "application/json" }),
      ...(init?.headers || {})
    },
    ...init,
  });
  if (!res.ok) { const txt = await res.text().catch(()=> ""); throw new Error(`HTTP ${res.status} @ ${url} | ${txt}`); }
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
}
