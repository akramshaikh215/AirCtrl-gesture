# Airctrl — updated control studio

## Run the updated project in VS Code (Windows)

1. Stop the old server with Ctrl+C. Extract this ZIP into a new folder and open its `airctrl` folder in VS Code.
2. Copy your existing `.env.local` into this folder if you had configured Supabase/Flask. Do not share it.
3. Open Terminal → New Terminal. Use these commands (no `corepack enable` needed):

```powershell
node --version
npx --yes pnpm@11.25.0 install --frozen-lockfile
npx --yes pnpm@11.25.0 run dev:next
```

Use Node 22.13 or newer. Open the localhost URL printed in the terminal, normally http://localhost:3000/studio. Use Chrome or Edge. Internet is required for the initial MediaPipe model/runtime downloads. Allow camera access when prompted.

## Start with hands

Choose **Hands → Preferred hand: Automatic · either hand → Website control → Start camera & control**.

The first detected hand is retained while visible, but the other hand is now acquired when it replaces the first. You may also select Left or Right explicitly. Labels compensate for the mirrored selfie preview; use Automatic if your camera driver already mirrors its output.

| What you want | How to do it |
|---|---|
| Move to a button | Extend only your index finger; move the pointer onto the button. A blue outline shows its target. |
| Click / confirm | Hold a thumbs up for about 0.7 seconds. The pointer stays at the last pointing location. Return to pointing before confirming again. |
| Alternative click | In Pointer tool, briefly pinch thumb and index together and release. |
| Drag | In Pointer tool, hold a pinch over the practice note for 0.55 seconds; move, then release. Desktop mode can drag native windows/items. Website drag is limited to the practice note. |
| Scroll | Point at the page or scrollable panel first. Raise index + middle fingers and move vertically. Return to one finger to move the pointer. Holding two fingers still does not scroll. |
| Volume | Extend index, middle and ring fingers, little finger folded; move vertically. Requires Desktop Control and a paired Windows agent. |
| Zoom | Select Zoom tool, then open/close thumb–index distance. Website mode zooms practice objects; Desktop Control sends Ctrl +/- to the active application. Select Pointer to click/drag again. |
| Back / forward | Swipe an open palm left/right in the mirrored preview within 0.65 seconds. Alternatively use the bottom toolbar or voice. |
| Pause | Hold an open palm still for 0.7 seconds. Resume with the button or “Resume control” if listening is enabled. |
| Emergency stop | Hold a fist for 0.25 seconds. Camera, microphone and control stop. Esc pauses; Windows also has Ctrl+Alt+Esc. |

**Open a dashboard:** point at Dashboard in the bottom toolbar, then thumbs up. Or enable voice and say **“Open dashboard”**. The account dashboard needs Supabase configuration and sign-in; it shows setup guidance otherwise. Session tracking stays mounted as you navigate within Airctrl.

**Back or refresh:** point at the bottom toolbar’s Back or Refresh button and confirm, or say **“Go back”**, **“Go forward”**, or **“Refresh”**. Website Refresh updates Next.js page data without turning off the camera. Desktop Refresh sends Ctrl+R to the foreground application.

Website control operates Airctrl content only, not another website, browser address bar, or operating system. Native desktop access requires the agent below.

## Use eyes without hand gestures

1. Choose **Eyes · beta** before starting. Optionally enable Voice listening as a fallback.
2. Press **Start camera & control** and allow the camera. Initial setup/permission may require a helper, keyboard, or the operating system’s accessibility tools.
3. Look at the centre marker with your head still until calibration finishes (60 open-eye tracked frames).
4. Look left/right/up/down to steer the cursor. Look back to centre to hold it in place. This is relative iris steering, not exact “look directly at any tiny button” gaze estimation.
5. At the highlighted button, close **both** eyes deliberately for **0.35–0.9 seconds**, then reopen. One click occurs. Short ordinary blinks and closures longer than 0.9 seconds are ignored.
6. Click **Eye scroll** in the toolbar (or say “Eye scroll”). Look up/down to scroll. Look at centre for **1.5 seconds** to return to pointer mode, or say “Eye pointer”.
7. Say “Calibrate eyes”, or return to the studio and select Recalibrate eyes if tracking drifts.

Eye steering is experimental. Good front lighting, a stable camera and a still head matter. Glasses, eye shape and camera quality can affect accuracy. No clinical accuracy or assistive-device certification is claimed. Test with the intended user before presenting it as an accessibility solution. Face loss suspends actions and cancels a pending blink click.

## Voice commands

Enable Voice listening, then use: **Start control**, **Pause control**, **Resume control**, **Stop session**, **Click**, **Double click**, **Scroll up/down**, **Open dashboard**, **Open studio**, **Go back**, **Go forward**, **Refresh**, **Eye scroll**, **Eye pointer**, **Calibrate eyes**, **Zoom in/out**, **Volume up/down**, **Stop listening**.

For voice-only operation, turn Camera tracking off, enable Voice listening, and press Start. Voice recognition availability depends on the browser, network and permissions. It may stop listening after browser/service errors; the UI shows its state.

## Enable real Windows desktop actions

Run the frontend locally. In a second VS Code terminal:

```powershell
cd desktop-agent
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe agent.py
```

Keep that terminal running. Enter its pairing code in the studio and press Connect agent. Stop the current session, choose Desktop Control, then start again. Camera tracking drives the native mouse; volume depends on Windows audio support. Do not run the old agent with the updated frontend: back/forward/refresh/zoom need this updated agent.

## Existing PostgreSQL users

The backend now accepts eye-input events and navigation actions. After installing the updated backend requirements, run from `backend` with your existing environment loaded:

```powershell
python -m flask --app app db upgrade
```

This applies the new `20261010_eye_events` migration and preserves existing history. The migration targets PostgreSQL as documented by the project. Authentication, database setup and environment details remain in README.md.

## Suggested judging demo (3 minutes)

1. Show the refreshed landing page and its three input choices.
2. Open studio, point and confirm a target, switch from right to left hand.
3. Scroll the full page, open Dashboard, return using the persistent toolbar.
4. Switch to Eyes; calibrate, steer and deliberate-blink click. Demonstrate eye scroll and return-to-centre.
5. Demonstrate a voice navigation command and fist emergency stop.
6. If a Windows agent is paired, show actual volume and application navigation. Clearly separate browser-only behavior from native control.

The supplied reference image shows a narrow scrolling panel rather than a judging rubric. This update follows your stated UI/UX and MVP priorities without inventing additional judging requirements.
