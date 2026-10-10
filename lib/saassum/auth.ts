import { createBrowserClient } from "@supabase/ssr";
export const configured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabase() {
  if (!configured()) return null;
  return (client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ));
}
export async function api(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const sb = supabase();
  const session = await sb?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in to save settings and session history.");
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    throw new Error(
      "Flask API is not configured. Browser practice remains available.",
    );
  const r = await fetch(base + path, {
    method,
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
