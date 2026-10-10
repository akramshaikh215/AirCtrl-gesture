import Link from "next/link";
import { ArrowDownToLine } from "lucide-react";
export default function Page() {
  return (
    <div className="readable">
      <span className="eyebrow">FROM BROWSER TO DESKTOP</span>
      <h1 style={{ fontSize: 42 }}>Make it your workspace.</h1>
      <p>
        Start with browser practice. When you’re ready for computer control, run
        the companion agent locally.
      </p>
      <a href="/downloads/saassum-ai-source.zip" className="button" download>
        <ArrowDownToLine size={17} /> Download complete source
      </a>
      <p style={{ fontSize: 11 }}>
        Includes the Next.js frontend, Flask API, PostgreSQL migrations, Windows
        agent, tests, and setup documentation.
      </p>
      <h2>1. Try the studio</h2>
      <p>
        No account is needed for Browser Demo. Open the studio in a desktop
        browser, click Start Control, and allow your camera. Enable voice
        separately if your browser supports speech recognition.
      </p>
      <Link className="textbutton" href="/studio">
        Open the Control Studio ↗
      </Link>
      <h2>2. Run it locally</h2>
      <p>
        Extract the source. Install Node.js 22.13+ and pnpm 11.25.0. In the
        project folder, run:
      </p>
      <pre className="codeblock">
        {"pnpm install --frozen-lockfile\npnpm run dev:next"}
      </pre>
      <p>
        Open <code>http://localhost:3000</code>. The README includes the
        complete Windows instructions.
      </p>
      <h2>3. Pair the Windows agent</h2>
      <p>
        Use Python 3.12 on the same computer. In a separate terminal, create a
        virtual environment inside <code>desktop-agent</code>, install its
        requirements, and run <code>python agent.py</code>.
      </p>
      <p>
        Enter the code displayed in that terminal into the studio’s Desktop
        Agent field. After pairing succeeds, select Desktop Control and start.
        The agent controls the primary display. Volume and brightness depend on
        device support.
      </p>
      <div className="banner">
        Use the local frontend for desktop control. Hosted HTTPS pages may block
        loopback connections; this deployment does not claim universal
        hosted-to-agent compatibility.
      </div>
      <h2>4. Connect accounts and saved history</h2>
      <p>
        Add Supabase’s public URL/key and your Flask API URL using{" "}
        <code>.env.example</code>. Configure email verification and callback
        URLs in Supabase. Start PostgreSQL and Flask with the included Docker
        Compose file. Your credentials and backend are not preconfigured in this
        published demo.
      </p>
      <h2>Know what’s verified</h2>
      <p>
        Production builds and automated gesture, API and agent protocol tests
        have passed. Webcam, microphone, Supabase email flows, and physical
        Windows controls need end-to-end testing on your setup. The download
        includes an honest feature matrix and a step-by-step acceptance
        checklist.
      </p>
      <h2>A simple way to stop</h2>
      <p>
        Pause on the page, or press Escape while it has focus. The local agent
        has an independent Ctrl+Alt+Esc emergency stop and PyAutoGUI’s
        screen-corner failsafe. Stop Session turns off camera and listening.
      </p>
    </div>
  );
}
