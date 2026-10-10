import { NextResponse } from "next/server";
import { serverAuth } from "../../../lib/saassum/server";
import { safeNext } from "../../../lib/saassum/core";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const sb = await serverAuth();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeNext(url.searchParams.get("next")), url.origin),
      );
  }
  return NextResponse.redirect(
    new URL("/auth/sign-in?error=callback", url.origin),
  );
}
