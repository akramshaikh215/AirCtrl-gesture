"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, configured } from "../../lib/saassum/auth";
import { safeNext } from "../../lib/saassum/core";
export default function AuthForm({ kind }: { kind: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("error"))
      setMessage(
        "The authentication link could not be verified. Request a fresh email link and open it in the same browser.",
      );
  }, []);
  const title: Record<string, string> = {
    "sign-in": "Welcome back.",
    "sign-up": "Make room for your flow.",
    "forgot-password": "Let’s get you back in.",
    "reset-password": "A fresh start.",
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    setMessage("");
    try {
      let result: any;
      if (kind === "sign-up")
        result = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: location.origin + "/auth/callback" },
        });
      else if (kind === "forgot-password")
        result = await sb.auth.resetPasswordForEmail(email, {
          redirectTo:
            location.origin + "/auth/callback?next=/auth/reset-password",
        });
      else if (kind === "reset-password")
        result = await sb.auth.updateUser({ password });
      else result = await sb.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (kind === "sign-up")
        setMessage("Check your email to verify your account.");
      else if (kind === "forgot-password")
        setMessage(
          "If your address is registered, a recovery link is on its way.",
        );
      else
        location.assign(
          safeNext(new URLSearchParams(location.search).get("next")),
        );
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel authbox">
      <span className="eyebrow">Airctrl</span>
      <h1>{title[kind]}</h1>
      <p>Save your preferences and pick up where you left off.</p>
      {!configured() ? (
        <div className="feedback">
          Authentication is not configured in this deployment. Add your Supabase
          URL and public anonymous key to enable accounts.{" "}
          <Link
            href="/studio"
            style={{ display: "block", marginTop: 12, color: "var(--teal)" }}
          >
            You can still try Browser Demo →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          {kind !== "reset-password" && (
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {kind !== "forgot-password" && (
            <label className="field">
              <span>Password · at least 8 characters</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={
                  kind === "sign-in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "One moment…"
              : kind === "sign-in"
                ? "Sign in"
                : kind === "sign-up"
                  ? "Create account"
                  : kind === "forgot-password"
                    ? "Send recovery email"
                    : "Update password"}
          </button>
          {process.env.NEXT_PUBLIC_GOOGLE_OAUTH === "true" &&
            ["sign-in", "sign-up"].includes(kind) && (
              <button
                className="button secondary"
                type="button"
                style={{ marginTop: 10 }}
                onClick={() =>
                  supabase()?.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: location.origin + "/auth/callback" },
                  })
                }
              >
                Continue with Google
              </button>
            )}
        </form>
      )}
      {message && (
        <p role="status" className="feedback">
          {message}
        </p>
      )}
      <div className="authlinks">
        <Link href={kind === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}>
          {kind === "sign-in" ? "Create an account" : "Back to sign in"}
        </Link>
        <Link href="/auth/forgot-password">Forgot password?</Link>
      </div>
    </section>
  );
}
