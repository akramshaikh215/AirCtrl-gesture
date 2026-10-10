# Airctrl

**Your hands guide the cursor. Your voice takes control.**

A hands-free hackathon MVP with a Next.js/React frontend, browser MediaPipe hand and face/iris tracking, allowlisted voice recognition, Flask/PostgreSQL persistence, Supabase Auth, and a separately installed Windows desktop agent.

See **START-HERE.md** for the updated hand/eye controls, Windows commands and demo checklist.

## What you can try now

The updated source supports Website Control without an account. Start camera & control requests your webcam and loads the selected hand or face model. The virtual cursor can activate buttons and links throughout Airctrl; scrolling targets the container under the cursor or the page. Internal navigation preserves the session. Voice requires a supported browser and explicit microphone activation. Camera, microphone and hardware behavior still need testing on your device.

This source package does **not** contain your Supabase credentials or a running Flask/PostgreSQL service. Authentication and history therefore show a configuration state, not a fake account. Real Windows control requires the native agent and the local setup below. Installing a website does not install the agent.

## Repository

- `app/`, `components/saassum/`, `lib/saassum/`: Next.js frontend at repository root.
- `backend/`: Flask API, SQLAlchemy models, migrations and tests.
- `desktop-agent/`: native Windows agent, adapters and protocol/transport tests.
- `shared/`: action contract.
- `docs/`: architecture, verification, and hackathon demo script.

The hosted build uses the Sites Vinext adapter for Next.js App Router source. `dev:next` / `build:next` use actual Next.js for conventional local development or hosting. Flask remains a separate Python service; no D1 or Firebase substitute is used.

## 1. Run the frontend locally

Install Node.js 22.13+ and pnpm 11.25.0. From the repository root:

```sh
npx --yes pnpm@11.25.0 install --frozen-lockfile
npx --yes pnpm@11.25.0 run dev:next
```

Open **http://localhost:3000**. Website Control works without environment configuration. Use `localhost` consistently, not a LAN IP or `127.0.0.1`, because agent origins and auth redirect URLs are exact.

To enable accounts and persistence, copy `.env.example` to `.env.local` and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_OAUTH=false
```

Restart the frontend after changing environment variables. Never put Supabase service-role keys in public variables.

## 2. Configure Supabase Auth

Create a Supabase project. Use an asymmetric JWT signing key (ES256 or RS256) so Flask can verify tokens using the project JWKS endpoint. Legacy HS256 signing is deliberately not accepted by this API.

In Authentication URL Configuration:

- Site URL: `http://localhost:3000`
- Allowed redirects: `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=/auth/reset-password`
- Add the corresponding exact HTTPS origin when separately deploying the full app.

Enable email/password and email confirmation. The frontend requests email links with its callback URL and exchanges PKCE codes for a cookie-backed session. Test verification/recovery in the browser where you initiated the request. Configure production SMTP for reliable mail delivery.

For Google, configure the provider and its Supabase callback with Google, then set `NEXT_PUBLIC_GOOGLE_OAUTH=true`. Otherwise the Google button is hidden.

## 3. Start PostgreSQL and Flask

Copy `backend/.env.example` to `backend/.env` and set `SUPABASE_URL`. With Docker installed, run from the root:

```sh
docker compose up --build
```

Compose creates PostgreSQL, runs Alembic upgrades, then starts Flask with Gunicorn on port 5000. The database/API ports bind only to loopback in this development configuration. Change default database passwords for any shared or hosted environment.

Without Docker, provision PostgreSQL and use Python 3.12:

```sh
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux alternative: source .venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL, SUPABASE_URL and FRONTEND_ORIGINS in backend/.env
flask --app app:create_app db upgrade
python app.py
```

`DATABASE_URL` uses `postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE`.

For external API hosting, use a Python host with PostgreSQL connectivity, HTTPS and a production WSGI server. Set `FRONTEND_ORIGINS` to the exact frontend origin; update `NEXT_PUBLIC_API_URL` and rebuild the frontend. Sites hosting runs the web frontend, not this Python process.

## 4. Run the Windows desktop agent

On the **same Windows 10/11 computer** as the browser, in a separate terminal:

```powershell
cd desktop-agent
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python agent.py
```

The agent displays a fresh pairing code. Open the locally running studio at **http://localhost:3000/studio**, enter the code, and click Connect Agent. Codes expire after five minutes and are single-use. Then select Desktop Control and explicitly Start Control. Each paired session expires after 15 minutes. Disconnect exits the agent; run it again for a new code.

The agent binds `127.0.0.1:8765`, permits only `http://localhost:3000` by default, and controls the primary display. Volume and brightness are advertised only if adapters detect support. External monitors may not expose brightness control.

- **Pause / Escape:** pause the browser’s active controls.
- **Ctrl+Alt+Esc:** local agent emergency stop, independent of webpage focus.
- **Move the physical pointer to a screen corner:** PyAutoGUI failsafe stops subsequent actions.
- **Ctrl+C in the terminal:** stop the agent and release held input.

Keep a physical input device available while testing. Never disable PyAutoGUI’s failsafe. Forced process termination cannot run cleanup; normal shutdown/disconnect and heartbeat loss do.

### Hosted site and localhost transport

The supported development transport is **local HTTP frontend → loopback WebSocket**. This path was exercised with a real WebSocket integration test and a fake hardware adapter; a Windows browser end-to-end test remains required.

A hosted HTTPS page may block plain loopback WebSocket connections or require local-network permission. The default agent also rejects the hosted origin. Use the local frontend for desktop control. Supporting hosted-to-agent control across browsers needs a deliberate trusted TLS/local bridge setup and matching Origin allowlist; it is not claimed working in this MVP. Do not disable browser security or allow arbitrary origins.

## Gestures and commands

- Index fingertip: cursor. Use Calibrate Centre at a comfortable hand position.
- Brief thumb/index pinch then release: one left click.
- Sustained pinch (default 550 ms): drag. Release, tracking loss, pause or stop ends it.
- Index + middle fingers extended, other fingers curled: vertical scroll.
- Explicit Zoom tool: pinch distance zooms practice objects or the active desktop application; clicks/drags disabled.
- Right click: voice command.

Enable listening to use “Start control”, “Pause control”, “Resume control”, “Stop session”, “Click”, “Double click”, “Right click”, “Scroll up/down”, “Zoom in/out”, “Volume up/down”, “Brightness up/down”, “Set volume to 40 percent”, “Set brightness to 70 percent”, “What can I say?”, and “Stop listening”.

Speech commands are English. Browser speech services may process audio remotely. No audio or raw voice transcripts are stored by Airctrl. System commands require Desktop Control. Desktop zoom sends fixed Ctrl +/- shortcuts to the active application. Browser zoom affects practice objects.

## Tests and builds

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm run build:next
# In a Python environment with backend requirements and websockets installed:
python -m pytest backend/test_api.py desktop-agent/test_protocol.py desktop-agent/test_transport.py
```

The test suite covers click/drag conflicts, release on tracking loss, gesture exclusivity, intent parsing, duplicate final results, return paths, signed-token verification, user isolation, preferences, idempotent telemetry, agent bounds/replay/heartbeat/pause, real WebSocket origin rejection, pairing and disconnect release. Python API tests use SQLite as an isolated test database, not as the production database.

Read `docs/VERIFICATION.md` before calling the app hardware-verified. Read `docs/DEMO.md` for the three-minute presentation.

## Official implementation references

- https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://pyjwt.readthedocs.io/en/stable/usage.html
- https://websockets.readthedocs.io/en/stable/reference/asyncio/server.html

See `docs/ARCHITECTURE.md` for trust boundaries, limitations and future extensions.
