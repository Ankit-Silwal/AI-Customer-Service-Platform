export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function req(path: string, init: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error((data as { message?: string })?.message ?? `Request failed ${r.status}`);
  return data;
}

export const api = {
  get: (p: string) => req(p),
  post: (p: string, body: unknown) => req(p, { method: "POST", body: JSON.stringify(body) }),
  patch: (p: string, body: unknown) => req(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: (p: string) => req(p, { method: "DELETE" }),
  upload: async (p: string, form: FormData) => {
    const r = await fetch(`${API}${p}`, { method: "POST", credentials: "include", body: form });
    const t = await r.text();
    const d = t ? JSON.parse(t) : null;
    if (!r.ok) throw new Error((d as { message?: string })?.message ?? "Upload failed");
    return d;
  },
};
