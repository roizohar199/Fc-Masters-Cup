export async function apiGet<T>(url: string): Promise<T> {
  const r = await fetch(`/api${url}`, { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPatch<T>(url: string, body: any): Promise<T> {
  const r = await fetch(`/api${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const markAllNotificationsRead = () =>
  apiPatch("/me/notifications/read-all", {});
