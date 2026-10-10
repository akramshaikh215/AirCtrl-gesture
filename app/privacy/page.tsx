import Link from "next/link";
export default function Page() {
  return (
    <div className="readable">
      <span className="eyebrow">CLEAR BY DESIGN</span>
      <h1 style={{ fontSize: 42 }}>Your control. Your choice.</h1>
      <p>
        Airctrl is a hands-free interaction MVP. You decide when sensing starts,
        what gets saved, and whether actions stay in the browser.
      </p>
      <h2>Your camera stays in your browser.</h2>
      <p>
        MediaPipe detects hand and face/iris landmarks on your device. Video frames are not
        sent to the Flask backend or stored. The recognition model and runtime
        download from Google and jsDelivr when you start. Stop Session closes
        the camera stream.
      </p>
      <h2>Your voice has a different path.</h2>
      <p>
        Voice uses your browser’s Speech Recognition API. Support varies. The
        browser or its provider may process audio remotely; this is not
        guaranteed offline recognition. Listening starts only when you enable
        it, and its status is always shown. Raw transcripts are not saved by
        this application.
      </p>
      <h2>Practice here. Control your desktop locally.</h2>
      <p>
        Website control operates buttons, links and scrolling within Airctrl. Real cursor, clicks,
        scrolling, volume and brightness require a paired Python agent on your
        computer. Hardware support varies. A disconnected agent pauses desktop
        actions.
      </p>
      <h2>Only useful history.</h2>
      <p>
        If signed in and history is enabled, we store session timestamps, mode,
        action types and outcomes in PostgreSQL. We do not store video or audio.
        You can delete history and preferences in Settings. This does not delete
        your Supabase login account.
      </p>
      <h2>A clear way to stop.</h2>
      <ul>
        <li>
          Pause stops control actions and releases held inputs. Voice may remain
          listening so you can say “Resume control”.
        </li>
        <li>Stop Session turns off camera and voice.</li>
        <li>
          Escape pauses the active webpage. The desktop agent also supports
          Ctrl+Alt+Esc and PyAutoGUI’s screen-corner failsafe.
        </li>
        <li>Switching away from the page pauses control.</li>
      </ul>
      <h2>More than one way to interact.</h2>
      <p>
        Essential controls are keyboard accessible. Tab to move through
        controls, Enter or Space to activate them. Sliders use arrow keys. The
        practice area also supports a physical mouse. Motion is reduced when
        your operating system requests it.
      </p>
      <p>
        This prototype offers another way to interact; it is not certified
        assistive technology. Eye steering is experimental and requires centre calibration with a still head. Gesture comfort and reliability differ by user,
        camera, and lighting.
      </p>
      <Link className="button" href="/studio">
        Explore the studio ↗
      </Link>
    </div>
  );
}
