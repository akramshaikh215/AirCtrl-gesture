For the updated three-minute hand/eye/voice demo, use **../START-HERE.md**. The script below is retained as the original baseline.

# Three-minute hackathon demonstration

## Before the demo
Use a well-lit Windows laptop, working webcam, Chrome/Edge with speech support verified, and the local frontend at http://localhost:3000. Install the agent beforehand. Verify PostgreSQL/API/Supabase if demonstrating saved history. Avoid projecting pairing secrets; generate a fresh code before presenting. Keep a physical mouse available.

## 0:00–0:25 — The problem
“Computers expect us to reach for a mouse and keyboard. Airctrl explores another option: your hands guide the cursor, your voice takes control.” Show the landing page, then open the studio. Explain Browser Demo vs Desktop Control.

## 0:25–1:20 — Gesture interaction
Start the camera, show landmarks, calibrate. Point and pinch the green target, hold a pinch to drag the note, use two fingers to scroll. Select Zoom and demonstrate content zoom. Pause to show that control stops immediately.

## 1:20–1:50 — Voice
Enable listening explicitly. Say “Resume control”, “Scroll down”, “Zoom in” and “Pause control”. Show the transcript, interpreted action and actual result. Mention that browser speech may use the provider’s servers.

## 1:50–2:25 — Actual desktop control
Connect the preinstalled Windows agent with a fresh pairing code. Select Desktop Control, start, and demonstrate a click or scroll in a harmless document. If volume/brightness capabilities are reported, demonstrate one adjustment. Explain loopback-only transport, allowlisted actions, and the independent emergency hotkey. Do not demonstrate an unsupported capability as successful.

## 2:25–3:00 — Trust and next steps
Stop the session. Show real saved history if configured; otherwise state that the persistence backend is supplied and not connected in this demo. Explain camera frames stay local, history contains only metadata, and future work includes multi-monitor support and user accessibility testing.
