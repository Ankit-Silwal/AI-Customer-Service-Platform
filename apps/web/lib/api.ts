export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parse<T>(r: Response): Promise<T> {
  const text = await r.text();
  const ct = r.headers.get("content-type") ?? "";
  const looksJson = ct.includes("application/json") || /^\s*[{[]/.test(text);
  if (!looksJson || !text) {
    throw new ApiError(
      r.status,
      !r.ok
        ? `Request failed (${r.status}): server returned ${ct || "a non-JSON response"}. Is the API gateway and the target service running, and is the route correct?`
        : "Empty or non-JSON response from server",
    );
  }
  let data: T & { message?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(r.status, `Request failed (${r.status}): server returned invalid JSON`);
  }
  if (!r.ok) throw new ApiError(r.status, (data as { message?: string })?.message ?? `Request failed (${r.status})`);
  return data as T;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  return parse<T>(r);
}

export const api = {
  get: <T,>(p: string) => req<T>(p),
  post: <T,>(p: string, body: unknown) => req<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch: <T,>(p: string, body: unknown) => req<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T,>(p: string) => req<T>(p, { method: "DELETE" }),
  upload: <T,>(p: string, form: FormData, onProgress?: (pct: number) => void) =>
    new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}${p}`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = (xhr.responseText ? JSON.parse(xhr.responseText) : null) as T & { message?: string };
          if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
          else reject(new ApiError(xhr.status, (data as { message?: string })?.message ?? "Upload failed"));
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    }),
};

/* ---------- shared types ---------- */
export interface Workspace { id: string; name: string; slug: string }
export interface Member { userId: string; role: string }
export interface Invitation { id: string; workspaceId: string; invitedUserId: string; role: string; status: string; expiresAt: string }
export interface Source { id: string; workspaceId: string; name: string; type: string }
export interface Doc { id: string; sourceId: string; filename: string; storageKey: string; status: string; createdAt: string }
export interface Conversation { id: string; workspaceId: string; customerId: string; status: string; assignedAgentId: string | null }
export interface ChatMsg { id: string; senderType: string; senderId: string | null; content: string; createdAt: string }
export interface Ticket { id: string; workspaceId: string; conversationId: string | null; title: string; status: string; priority: string; assigneeId: string | null }
export interface SessionUser { id: string; name: string; email: string; isEmailVerified: boolean }
