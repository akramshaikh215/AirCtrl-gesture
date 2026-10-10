import Link from "next/link";
import {
  MousePointer2,
  Hand,
  MoveVertical,
  Maximize,
  Mic,
  ArrowUpRight,
} from "lucide-react";
import HandDiagram from "../../components/saassum/HandDiagram";
export default function Page() {
  return (
    <>
      <div className="pagetitle">
        <div>
          <span className="eyebrow">SMALL MOVEMENTS. CLEAR INTENTIONS.</span>
          <h1>A language you already know.</h1>
          <p>Meet your gestures. Practice at your own pace.</p>
        </div>
      </div>
      <div className="banner">
        Start a session in the studio. Your controls stay active when you navigate within this website.
      </div>
      <div className="guidegrid">
        {[
          [Hand, "07", "Thumbs up to confirm", "Point at a button first, then curl your fingers and hold a thumbs up for 0.7 seconds. One click per pose.", "Works with either hand"],
          [Hand, "08", "Open palm to pause", "Hold an open palm still for 0.7 seconds. Say Resume control to continue if voice is enabled.", "Releases held input"],
          [Hand, "09", "Fist for emergency stop", "Close your hand into a fist for 0.25 seconds. Stops camera, microphone and control.", "Esc also pauses"],
          [MoveVertical, "10", "Three fingers for volume", "Extend index, middle and ring fingers. Move up/down to change system volume in Desktop Control.", "Paired Windows agent required"],
          [Hand, "11", "Swipe to navigate", "Swipe your open palm horizontally within 0.65 seconds. Left in the mirrored preview goes back; right goes forward.", "Hold still instead to pause"],
          [MousePointer2, "12", "Eyes to steer · beta", "Choose Eyes in the studio. Look at the centre to calibrate. Look away to steer, then centre to hold. Close both eyes 0.35–0.9 seconds and reopen to click. Eye scroll uses vertical gaze; centre for 1.5 seconds returns to pointer.", "Experimental webcam steering"],
          [
            MousePointer2,
            "01",
            "Point to move",
            "Extend your index finger and move it gently. Calibrate a comfortable centre in the studio.",
            "Cursor sensitivity",
          ],
          [
            Hand,
            "02",
            "Pinch to click",
            "Touch your thumb and index fingertip briefly, then release. A held pinch will not repeatedly click.",
            "Pinch threshold & debounce",
          ],
          [
            Hand,
            "03",
            "Hold to drag",
            "Keep the pinch held until Dragging appears. Move your hand, then release. Tracking loss also releases.",
            "Drag hold duration",
          ],
          [
            MoveVertical,
            "04",
            "Two fingers to scroll",
            "Extend index and middle fingers, curl ring and little fingers. Move your hand vertically.",
            "Scroll sensitivity & direction",
          ],
          [
            Maximize,
            "05",
            "A little more perspective",
            "Select the Zoom tool in the studio. Open or close your thumb–index distance. Click and drag are disabled in this tool.",
            "Practice objects / desktop app zoom",
          ],
          [
            Mic,
            "06",
            "Or, just say it",
            "Enable voice listening. Try “Click”, “Scroll down”, “Pause control”, or “What can I say?”.",
            "English US / India",
          ],
        ].map(([Icon, n, title, desc, setting]: any) => (
          <article className="panel guide" key={n}>
            <div className="diagram">
              {n === "01" ? (
                <HandDiagram small />
              ) : (
                <Icon size={65} strokeWidth={1} />
              )}
            </div>
            <div className="eyebrow" style={{ marginTop: 20 }}>
              GESTURE {n}
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
            <small>{setting}</small>
            <div style={{ marginTop: 18 }}>
              <Link className="textbutton" href="/studio">
                Practice in studio <ArrowUpRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
