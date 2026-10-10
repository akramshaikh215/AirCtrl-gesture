# Verification of the hand/eye control update

## Passed in this run

- `pnpm test`: 15 tests. Includes existing click/drag conflicts, tracking-loss release, hand switching, deliberate versus normal blinks, gaze movement, eye scrolling, return-to-centre, palm/fist/thumb/swipe/volume gestures and navigation voice intents.
- `pnpm exec tsc --noEmit`: passed after the final TypeScript changes.
- `pnpm run build:next`: passed production compilation, TypeScript and generation of 14 pages for the UI/eye-control implementation. Subsequent changes were small input-dispatch safeguards and documentation/backend changes; final TypeScript check passed.
- `python -m pytest backend/test_api.py desktop-agent/test_protocol.py -q`: 21 tests passed. Includes eyes/navigation history, source validation, fixed native navigation allowlist and bounded zoom input.

## Not verified here

- Browser visual and interactive QA: attempted with Playwright. Chromium download succeeded using a compatible release, but the execution environment prohibited browser socket creation, so no screenshots or browser interaction assertions were produced.
- Real webcam hand/face recognition, blink recognition accuracy and lighting sensitivity. Synthetic landmarks only were used for engine tests.
- Windows PyAutoGUI, audio adapters, native shortcuts, hardware fail-safe and a live paired desktop session.
- Live Supabase authentication or an actual PostgreSQL server. API tests use signed test JWTs and SQLite; the new migration inspects PostgreSQL constraint names and needs deployment verification.
- WebSocket integration tests from the original project were retained but not rerun for this update.

## Required local acceptance

Use START-HERE.md. Verify left-to-right and right-to-left hand switching; exactly one thumbs-up click; open-palm pause; fist stop; actual page scrolling and navigation. Confirm camera remains active between internal routes and stops on Stop. With eyes, calibrate, test ordinary versus deliberate blinks, confirm no click after face loss and confirm returning to centre leaves scroll mode. Test responsive layout and focus visibility. Check database migration on a backed-up development database. In Windows, pair the updated agent and test fixed shortcuts in a harmless application.

Do not present this experimental webcam eye mode as validated assistive technology or claim measured accuracy, latency, or user success rates.
