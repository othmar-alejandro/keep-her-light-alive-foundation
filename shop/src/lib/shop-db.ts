// Server-only access to the shop tables through Supabase's REST API.
// SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so it never reaches the
// browser bundle. Import this only from route handlers and server components.

export class ShopDbError extends Error {
  constructor(
    message: string,
    // Postgres/PostgREST error code, e.g. P0001 (insufficient stock).
    readonly code?: string,
  ) {
    super(message);
    this.name = "ShopDbError";
  }
}

export function isShopDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ShopDbError("Supabase is not configured.");
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    throw new ShopDbError(body?.message || `Shop database HTTP ${response.status}`, body?.code);
  }
  return (await response.json()) as T;
}

export function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  return request<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
}

export function select<T>(table: string, query: URLSearchParams): Promise<T[]> {
  return request<T[]>(`${table}?${query}`, { method: "GET" });
}
