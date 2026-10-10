# Airctrl landing page update

The landing page follows the supplied warm peach and pink visual reference with vivid layered wave artwork, large centred typography, black pill buttons, subtle decorative motion, input-preview tabs, an expandable FAQ and a mobile navigation menu. Illustrative previews are clearly labelled and do not activate the camera.

## Changed frontend files

- app/page.tsx
- app/globals.css (homepage-scoped styling appended)
- components/saassum/Shell.tsx (homepage navigation and footer styling plus mobile menu)
- components/saassum/FlowWaves.tsx (new local SVG artwork)

The tracking engines, Studio controls, authentication, Flask backend, database migrations and desktop agent are unchanged from the previous Airctrl package. No extra dependencies were added.

## Run in VS Code on Windows

Extract the ZIP and open the airctrl folder. Copy your existing .env.local if configured. Stop the old server with Ctrl+C and run:

```powershell
npx --yes pnpm@11.25.0 install --frozen-lockfile
npx --yes pnpm@11.25.0 run dev:next
```

Open the localhost URL printed by the terminal. The landing page is at / and controls are at /studio. Hard-refresh the browser if it shows the old styles.

## Frontend only installation

If keeping your existing setup, copy the four files listed above into the corresponding paths of your existing project, then restart the frontend. Keep existing environment files.

## Verification

TypeScript and the Next.js production build passed. Comparing hashes confirmed that control engines, Studio, authentication, backend and desktop agent files did not change. Browser visual QA could not run because the local Chromium executable was unavailable; check desktop and mobile layouts locally before presenting.
