# Airctrl architecture

The repository root is the Next.js frontend (App Router). `backend/` is Flask. `desktop-agent/` is native Python. The hosting adapter builds the Next.js route source with Vinext for Sites/Cloudflare Workers; local development and conventional deployment can use the included `dev:next` and `build:next` scripts.

## Data paths

- Camera → browser MediaPipe → GestureEngine → common dispatcher.
- Microphone → browser speech provider → deterministic intent parser → same dispatcher.
- Browser mode → practice targets, draggable note, scroll panel, zoom state.
- Desktop mode → loopback WebSocket → explicit origin/pairing checks → validated Controller → Windows adapter.
- User login → Supabase SSR cookie session → bearer token → Flask JWT verification → user-scoped PostgreSQL records.

Flask never receives camera frames, audio, raw voice transcripts, or a continuous cursor stream. The agent never receives arbitrary scripts or natural-language prompts. Only the frontend connects to the agent, not the hosted API.

## Safety transitions

Pause clears pending movement and sends PAUSE; the agent releases input. Tracking loss immediately sends RELEASE_ALL and resets gesture recognition. Six consecutive tracked frames are needed before gesture actions resume. A lost hand must reappear with the same handedness; stop/restart selects another controlling hand. A short pinch releases a single click; long pinch transitions to drag and never also clicks. Scroll pose and explicit Zoom tool suppress conflicting actions.

The agent expires control after 15 minutes; restart and pair again. Pairing codes are random, single-use and valid for five minutes. The local user supplies the code shown in the terminal to approve pairing. One controller is allowed. Pairing retries are limited. Server binds `127.0.0.1` and rejects missing/untrusted Origin. Heartbeat timeout is 2.5 seconds; rate limit is 80 messages/second; messages are limited to 2 KiB and validated for sequence, bounds and a short expiry. Input fail-safe, local hotkey and terminal Ctrl+C provide independent stop paths. Disconnect exits the agent; restart generates a new code.

Movement coalesces to the latest position at 20 Hz; it is not sent while the socket is backlogged. No credentials are put in the connection URL or permanent frontend storage. The default transport is local HTTP frontend + loopback WS on the same computer.

## Database

Preferences are keyed by verified Supabase subject UUID. Control sessions carry a user UUID ownership index. Command events have a session foreign key with cascading deletion and unique client event IDs for idempotent batching. Supabase users live in a separate managed identity service; no cross-database user foreign key is assumed.

Flask validates asymmetric Supabase JWTs (ES256/RS256), audience, issuer, expiry and UUID subject via cached JWKS. Legacy HS256 projects must migrate signing keys; no insecure signature fallback is provided. Server ownership filters apply to every session read/write. Tests use signed RSA tokens and SQLite for isolation; production configuration is PostgreSQL.

## Known boundaries

- Only primary display mouse coordinates; multi-monitor selection is future work.
- Right-click is voice-only. Zoom affects demo content, not external applications.
- Voice commands are English; two recognition locales are offered.
- Browser speech support and remote processing depend on browser/provider.
- Permissions cannot be granted by code; the user must grant them.
- Hosted HTTPS → loopback WS is not guaranteed to work across browsers; use local setup. No browser security-disabling instructions are required.
- Exiting a tab can interrupt telemetry; physical input release remains agent-enforced by disconnect and heartbeat. Abruptly abandoned history can remain marked running.
- Account deletion is not implemented; history and preferences deletion are separate and explicit.
