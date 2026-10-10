"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { api, supabase } from "../../lib/saassum/auth";
import { defaults, type Preferences } from "../../lib/saassum/core";
export default function Account({
  settings = false,
  name = "there",
}: {
  settings?: boolean;
  name?: string;
}) {
  const [prefs, setPrefs] = useState<Preferences>(defaults),
    [sessions, setSessions] = useState<any[]>([]),
    [frequent, setFrequent] = useState<any[]>([]),
    [message, setMessage] = useState(""),
    [loaded, setLoaded] = useState(false),
    [permissions, setPermissions] = useState({
      camera: "Unknown",
      microphone: "Unknown",
    });
  useEffect(() => {
    Promise.all([
      api("/api/preferences"),
      api("/api/sessions"),
      api("/api/stats"),
    ])
      .then(([p, s, stats]) => {
        setFrequent(stats.voice_commands);
        setPrefs({ ...defaults, ...p });
        setSessions(s);
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoaded(true));
    for (const n of ["camera", "microphone"])
      navigator.permissions
        ?.query({ name: n as PermissionName })
        .then((r) => setPermissions((p) => ({ ...p, [n]: r.state })))
        .catch(() => {});
  }, []);
  async function save() {
    try {
      await api("/api/preferences", "PUT", prefs);
      setMessage("Your preferences are saved.");
    } catch (e: any) {
      setMessage(e.message);
    }
  }
  return (
    <>
      <div className="pagetitle">
        <div>
          <span className="eyebrow">
            {settings ? "MAKE IT FEEL LIKE YOU" : "YOUR WORKSPACE"}
          </span>
          <h1>{settings ? "A comfortable setup." : `Welcome, ${name}.`}</h1>
          <p>
            {settings
              ? "Small adjustments make a meaningful difference."
              : "A new way to move through your day."}
          </p>
        </div>
        <button
          className="tool"
          onClick={async () => {
            await supabase()?.auth.signOut();
            location.assign("/");
          }}
        >
          Sign out
        </button>
      </div>
      {message && (
        <div role="status" className="banner">
          {message}
        </div>
      )}
      {settings ? (
        <>
          <div className="settingsgrid">
            <section className="panel">
              <h3>Movement & gestures</h3>
              <label className="field">
                <span>Preferred control mode</span>
                <select
                  value={prefs.mode}
                  onChange={(e) => setPrefs({ ...prefs, mode: e.target.value })}
                >
                  <option value="browser">In-Browser Demo</option>
                  <option value="desktop">Desktop Control</option>
                </select>
              </label>
              {(
                [
                  ["gestures", "Enable hand gestures"],
                  ["click", "Pinch click"],
                  ["drag", "Pinch drag"],
                  ["scrollEnabled", "Two-finger scroll"],
                ] as const
              ).map(([key, label]) => (
                <label className="switchrow" key={key}>
                  {label}
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) =>
                      setPrefs({ ...prefs, [key]: e.target.checked })
                    }
                  />
                </label>
              ))}
              {[
                ["sensitivity", "Cursor sensitivity", 0.5, 2, 0.1],
                ["smoothing", "Movement response", 0.1, 0.7, 0.05],
                ["pinch", "Pinch entry threshold", 0.15, 0.6, 0.01],
                ["debounce", "Click debounce (ms)", 200, 1000, 50],
                ["hold", "Drag hold (ms)", 300, 1200, 50],
                ["scroll", "Scroll sensitivity", 0.5, 3, 0.1],
              ].map(([key, label, min, max, step]) => (
                <label key={key} className="field">
                  <span>
                    {label}
                    <b>{String(prefs[key as keyof Preferences])}</b>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={Number(prefs[key as keyof Preferences])}
                    onChange={(e) =>
                      setPrefs({ ...prefs, [key]: +e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="switchrow">
                Reverse scroll direction
                <input
                  type="checkbox"
                  checked={prefs.invert}
                  onChange={(e) =>
                    setPrefs({ ...prefs, invert: e.target.checked })
                  }
                />
              </label>
            </section>
            <section className="panel">
              <h3>Voice & privacy</h3>
              <label className="field">
                <span>Voice language</span>
                <select
                  value={prefs.language}
                  onChange={(e) =>
                    setPrefs({ ...prefs, language: e.target.value })
                  }
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                </select>
              </label>
              <label className="switchrow">
                Save session history
                <input
                  type="checkbox"
                  checked={prefs.history}
                  onChange={(e) =>
                    setPrefs({ ...prefs, history: e.target.checked })
                  }
                />
              </label>
              <p className="controlnote">
                No video, audio, or raw voice transcripts are stored.
              </p>
              <div className="separator" />
              <p className="controlnote">
                Camera: {permissions.camera}
                <br />
                Microphone: {permissions.microphone}
                <br />
                Desktop agent: connect from the Control Studio.
              </p>
              <button className="button" onClick={save}>
                Save preferences
              </button>
              <button
                className="button secondary"
                style={{ marginTop: 10 }}
                onClick={() => setPrefs({ ...defaults })}
              >
                Reset to defaults
              </button>
              <div className="separator" />
              <h3>Your stored data</h3>
              <p className="controlnote">
                Deleting history or preferences does not delete your login
                account. These actions cannot be undone.
              </p>
              <button
                className="button danger"
                onClick={async () => {
                  if (!confirm("Delete all saved session history?")) return;
                  try {
                    await api("/api/history", "DELETE");
                    setMessage("History deleted.");
                  } catch (e: any) {
                    setMessage(e.message);
                  }
                }}
              >
                Delete history
              </button>
              <button
                className="tool"
                style={{ marginTop: 12 }}
                onClick={async () => {
                  if (!confirm("Delete your saved preferences?")) return;
                  try {
                    await api("/api/preferences", "DELETE");
                    setPrefs({ ...defaults });
                    setMessage("Saved preferences deleted.");
                  } catch (e: any) {
                    setMessage(e.message);
                  }
                }}
              >
                Delete saved preferences
              </button>
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <strong>{sessions.length}</strong>
              <span>Saved sessions</span>
            </div>
            <div className="stat">
              <strong>
                {sessions.reduce((n, s) => n + s.command_count, 0)}
              </strong>
              <span>Recorded actions</span>
            </div>
            <div className="stat">
              <strong>{prefs.sensitivity.toFixed(1)}×</strong>
              <span>Cursor sensitivity</span>
            </div>
          </div>
          <div className="banner">
            Camera: {permissions.camera} · Microphone: {permissions.microphone}{" "}
            · Agent: check connection in the studio
          </div>
          <Link className="button" href="/studio">
            Start control <ArrowUpRight size={16} />
          </Link>
          <h2 style={{ fontSize: 23, marginTop: 35 }}>Your voice shortcuts</h2>
          <div className="toolbar">
            {frequent.length ? (
              frequent.map((f) => (
                <span className="pill" key={f.action}>
                  {f.action.toLowerCase().replaceAll("_", " ")} · {f.count}
                </span>
              ))
            ) : (
              <p className="controlnote">
                Your most-used voice actions will appear after a saved session.
              </p>
            )}
          </div>
          <h2 style={{ fontSize: 23, marginTop: 35 }}>Recent sessions</h2>
          <section className="panel">
            {!loaded ? (
              <div className="empty">Loading your sessions…</div>
            ) : sessions.length ? (
              sessions.map((s) => (
                <div className="sessionrow" key={s.id}>
                  <span>{new Date(s.started_at).toLocaleString()}</span>
                  <span>
                    {s.mode} · {s.command_count} actions ·{" "}
                    {s.ended_at
                      ? Math.max(
                          0,
                          Math.round(
                            (Date.parse(s.ended_at) -
                              Date.parse(s.started_at)) /
                              1000,
                          ),
                        ) + "s"
                      : s.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty">
                <Clock size={30} />
                <h2>Your first session starts here.</h2>
                <p>
                  Open the studio and explore the practice area.
                  <br />
                  Your saved sessions will appear here when history is enabled.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
