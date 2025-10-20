import { fetchJSON } from "./lib/fetchJSON";

export async function api(path: string, init?: RequestInit) {
  return fetchJSON(path, {
    headers: { "Content-Type": "application/json" }, 
    ...init 
  });
}

// helper for auth endpoints that may return empty responses
export async function apiRaw(path: string, init?: RequestInit) {
  const fullPath = path;
  const res = await fetch(fullPath, { 
    credentials: "include",
    headers: { Accept: "application/json" },
    ...init 
  });
  
  const ct = res.headers.get("content-type") || "";
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (ct.includes("application/json")) {
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || json.message || text);
      } catch {
        throw new Error(text);
      }
    }
    // אם זה לא JSON, זה כנראה HTML
    throw new Error(
      `Expected JSON but got ${ct || "unknown"} (HTTP ${res.status}) from ${fullPath}. First 200 chars:\n` +
      text.slice(0, 200)
    );
  }
  
  return res;
}

