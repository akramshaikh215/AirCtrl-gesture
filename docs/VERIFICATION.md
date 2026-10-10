For the current hand/eye update, see **UPDATE-VERIFICATION.md**. The matrix below describes the original baseline; new behavior is documented in START-HERE.md.

# Verification and feature matrix

Automated verification performed in a Linux build environment, without webcam, microphone, Windows desktop, Supabase credentials, or PostgreSQL server.

| Feature | Implementation | Verification |
|---|---|---|
| Landing, studio, gesture guide, privacy, auth, dashboard, settings routes | Implemented | TypeScript and production build |
| Click/drag/scroll/zoom conflict logic | Implemented | Synthetic landmark unit tests |
| Camera acquisition, landmark overlay, browser practice | Implemented | Hardware/browser test required |
| Voice intent parsing and duplicate final-result prevention | Implemented | Unit tests |
| Browser speech recognition | Implemented | Microphone/browser test required |
| Supabase SSR login, email verification, reset, protected pages | Implemented | Credentials/integration test required |
| Flask user ownership, input validation, idempotent history | Implemented | Signed-JWT API tests using SQLite |
| PostgreSQL schema and migrations | Implemented | Migration upgrade verified on SQLite; PostgreSQL deployment test required |
| Origin rejection, pairing, WebSocket commands and disconnect release | Implemented | Real loopback WebSocket integration test with fake hardware adapter |
| Agent pause, heartbeat, bounds, replay protection | Implemented | Protocol tests |
| Global Windows input, local hotkey, volume and brightness | Implemented | Windows hardware test required |
| macOS/Linux input and multi-monitor selection | Not implemented | Future extension |
| Cross-application zoom, arbitrary terminal commands | Not implemented | Outside MVP |

No visual browser QA was available in the managed environment. A successful build is not a substitute for the following manual tests.

## Manual acceptance checklist (Windows 10/11)

1. Install dependencies, configure Supabase and Flask, migrate PostgreSQL. Open `http://localhost:3000`.
2. Open landing and all routes at laptop and mobile widths. Tab through controls and inspect visible focus. Enable OS reduced motion.
3. Open studio; camera is off. Deny camera access; verify readable error. Allow camera and retry; verify live video/landmarks.
4. Move one hand. Confirm mirrored movement and calibrate. Remove hand; movement stops. Reintroduce hand; no immediate click.
5. Point at green target and briefly pinch/release. Exactly one click. Hold pinch; no repeated clicks.
6. Hold pinch over note to drag. Release, hide hand, Pause, Stop, and switch tabs; each must end dragging.
7. Raise index/middle fingers; scroll. No click or drag. Switch to Zoom; pinch distance changes content scale, no clicks.
8. Enable voice; verify mic status. Say each documented command. Pause then say Click: no action. Resume works while listening. Stop Session closes camera and microphone. Stop listening does not restart.
9. Start native agent. Try wrong code and then fresh correct code. Verify Connected only after authenticated handshake. Select Desktop Control and explicitly start.
10. Check primary screen pointer, left/right/double click, drag, and scroll in a harmless local document. Verify volume readback and supported monitor brightness readback. Unsupported hardware must show a reason.
11. While dragging, disconnect agent and terminate its process. Verify mouse-up or documented OS behavior on forced termination. Normal disconnect, Ctrl+C, Ctrl+Alt+Esc and screen-corner failsafe must release. For force-kill, use physical mouse if the OS retains a held button; no process can guarantee cleanup after forcible kill.
12. Wait without heartbeats: agent must release and close. Replay a sequence/expired message: no action, paused. Unknown Origin must not pair.
13. Register, verify email, sign in, reset password, sign out. Logged-out private routes redirect. Expired sessions cannot read API data.
14. Save settings, refresh, start new session, stop, verify history. Disable history: new sessions are not saved. Delete history/preferences and verify another user’s data is unaffected.
15. Disconnect Flask during use. Controls must still pause/stop safely; show save failure honestly.
