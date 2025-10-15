export async function api(path: string, init?: RequestInit) {
  // Use relative path for API calls (will use Vite proxy)
  const fullPath = path;
  
  const res = await fetch(fullPath, { 
    headers: { "Content-Type": "application/json" }, 
    credentials: "include", // allow cookies for auth
    ...init 
  });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorText;
    } catch {}
    throw new Error(errorMessage);
  }
  return res.json();
}

// helper for auth endpoints that may return empty responses
export async function apiRaw(path: string, init?: RequestInit) {
  const fullPath = path;
  const res = await fetch(fullPath, { credentials: "include", ...init });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

