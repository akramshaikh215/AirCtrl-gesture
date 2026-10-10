"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { EyeEngine, chooseHand } from "../../lib/saassum/eyes";
import {
  Camera,
  MousePointer2,
  Hand,
  Mic,
  Play,
  Pause,
  Square,
  Maximize,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  GestureEngine,
  defaults,
  intent,
  clamp,
  FinalResults,
  type Action,
  type Preferences,
} from "../../lib/saassum/core";
import { Agent } from "../../lib/saassum/agent";
import { api, supabase } from "../../lib/saassum/auth";
const commands =
  "Open dashboard · Open studio · Go back · Go forward · Refresh · Eye scroll · Eye pointer · Calibrate eyes · Click · Double click · Right click · Scroll up/down · Zoom in/out · Volume up/down · Set volume to 40 percent · Brightness up/down · Set brightness to 70 percent · Pause control · Resume control · Stop session · Stop listening";
export default function Studio() {
  const router=useRouter(), pathname=usePathname();
  const [inputMode,setInputMode]=useState("hand"), [hand,setHand]=useState("auto"), [eyeScroll,setEyeScroll]=useState(false);
  const inputRef=useRef("hand"), handRef=useRef("auto"), eyeScrollRef=useRef(false), eyes=useRef(new EyeEngine());
  const hovered=useRef<HTMLElement|null>(null);
  function eyeMode(value:boolean) { eyeScrollRef.current=value; setEyeScroll(value); }
  function hitTarget() { return document.elementFromPoint(position.current.x*window.innerWidth,position.current.y*window.innerHeight) as HTMLElement|null; }
  function highlight() {
    hovered.current?.classList.remove("gaze-hover");
    hovered.current=hitTarget()?.closest<HTMLElement>('button,a,input,select,[role="button"]') || null;
    hovered.current?.classList.add("gaze-hover");
  }
  const [state, setState] = useState("Ready"),
    [gesture, setGesture] = useState("Waiting for camera tracking"),
    [mode, setMode] = useState("browser"),
    [prefs, setPrefs] = useState<Preferences>(defaults),
    [voice, setVoice] = useState(false),
    [gestures, setGestures] = useState(true),
    [agentStatus, setAgentStatus] = useState("Not connected"),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(
      "Camera permission is requested only when you start. Video is processed in this browser.",
    ),
    [error, setError] = useState(false),
    [tool, setTool] = useState("pointer"),
    [pos, setPos] = useState({ x: 0.5, y: 0.5 }),
    [note, setNote] = useState({ x: 0.15, y: 0.55 }),
    [zoom, setZoom] = useState(1),
    [hits, setHits] = useState(0),
    [log, setLog] = useState<{ text: string; time: string }[]>([]),
    [voiceAvailable, setVoiceAvailable] = useState(false),
    [phrase, setPhrase] = useState(""),
    [duration, setDuration] = useState(0);
  const video = useRef<HTMLVideoElement>(null),
    overlay = useRef<HTMLCanvasElement>(null),
    area = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLDivElement>(null),
    engine = useRef(new GestureEngine()),
    landmarker = useRef<any>(null),
    stream = useRef<MediaStream | null>(null),
    raf = useRef(0),
    running = useRef(false),
    stateRef = useRef("Ready"),
    recognition = useRef<any>(null),
    listening = useRef(false),
    generation = useRef(0),
    dragging = useRef(false),
    position = useRef(pos),
    target = useRef<HTMLButtonElement>(null),
    noteElement = useRef<HTMLDivElement>(null),
    noteRef = useRef(note),
    modeRef = useRef(mode),
    toolRef = useRef(tool),
    gestureOn = useRef(true),
    agent = useRef<Agent | null>(null),
    dispatchRef = useRef<(a: Action, source?: string) => void>(() => {}),
    session = useRef<string | null>(null),
    events = useRef<any[]>([]),
    startTime = useRef(0),
    handIdentity = useRef<string | null>(null),
    lastFrame = useRef(-1),
    shownGesture = useRef("");
  function status(s: string) {
    stateRef.current = s;
    setState(s);
  }
  function feedback(text: string, bad = false) {
    setMessage(text);
    setError(bad);
  }
  function record(a: Action, result: string, source: string) {
    if (
      ["MOVE_CURSOR", "HEARTBEAT", "RELEASE_ALL", "MOUSE_UP"].includes(a.type)
    )
      return;
    setLog((x) =>
      [
        {
          text: `${a.type.replaceAll("_", " ")} · ${result}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
        ...x,
      ].slice(0, 15),
    );
    if (prefs.history && session.current)
      events.current.push({
        id: crypto.randomUUID(),
        action: a.type,
        source,
        result: result === "Done" ? "success" : "unsupported",
      });
  }
  async function flush() {
    if (!session.current || !events.current.length) return;
    const batch = events.current.splice(0, 100);
    try {
      await api(`/api/sessions/${session.current}/events`, "POST", {
        events: batch,
      });
    } catch {
      events.current.unshift(...batch);
      events.current = events.current.slice(0, 300);
    }
  }
  function release() {
    eyes.current.lost();
    hovered.current?.classList.remove("gaze-hover");
    engine.current.release();
    dragging.current = false;
    agent.current?.release();
  }
  function pause() {
    if (stateRef.current === "Initializing") {
      void stop();
      return;
    }
    generation.current++;
    running.current = false;
    release();
    status("Paused");
    feedback(
      "Control is paused. " +
        (listening.current
          ? "Voice is still listening for “Resume control”."
          : ""),
    );
  }
  function mute() {
    listening.current = false;
    recognition.current?.abort();
    recognition.current = null;
    setVoice(false);
  }
  async function stop() {
    generation.current++;
    running.current = false;
    release();
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    landmarker.current?.close();
    landmarker.current = null;
    if (video.current) video.current.srcObject = null;
    overlay.current?.getContext("2d")?.clearRect(0, 0, 640, 480);
    mute();
    startTime.current = 0;
    status("Stopped");
    setGesture("Waiting for camera tracking");
    feedback("Session stopped. Camera and microphone are off.");
    await flush();
    const id = session.current;
    session.current = null;
    if (id)
      try {
        await api(`/api/sessions/${id}/end`, "PATCH", {});
      } catch {
        feedback(
          "Control stopped safely. Session summary could not be saved.",
          true,
        );
      }
  }
  async function start() {
    if (stateRef.current === "Initializing" || stateRef.current === "Running")
      return;
    if (modeRef.current === "desktop" && !agent.current?.ready) {
      feedback(
        "Connect and pair the local agent before starting Desktop Control.",
        true,
      );
      return;
    }
    if (!gestureOn.current && !listening.current) {
      feedback("Enable gesture control or voice listening first.", true);
      return;
    }
    const g = ++generation.current;
    status("Initializing");
    feedback("Preparing your control session…");
    try {
      if (gestureOn.current && !stream.current) {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Camera API is unavailable. Open this site in a secure browser context.",
          );
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (g !== generation.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        video.current!.srcObject = s;
        await video.current!.play();
        const { FilesetResolver, HandLandmarker, FaceLandmarker } =
          await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm",
        );
        const detector = inputRef.current === "eyes" ? await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"},
          runningMode:"VIDEO", numFaces:1, outputFaceBlendshapes:true,
          minFaceDetectionConfidence:.6, minTrackingConfidence:.6,
        }) : await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        if (g !== generation.current) {
          detector.close();
          return;
        }
        landmarker.current = detector;
      }
      if (g !== generation.current) return;
      if (modeRef.current === "desktop") {
        const r = await agent.current!.send({ type: "RESUME" });
        if (!r.ok) throw new Error(r.error);
      }
      if (g !== generation.current) return;
      running.current = true;
      status("Running");
      engine.current.release();
      if(inputRef.current === "eyes") eyes.current.reset();
      handIdentity.current = null;
      lastFrame.current = -1;
      feedback(
        modeRef.current === "browser"
          ? "You’re ready. Raise one hand in front of the camera."
          : "Desktop control active. Emergency stop: Ctrl+Alt+Esc or move mouse to a screen corner.",
      );
      if (!startTime.current) {
        startTime.current = Date.now();
        setDuration(0);
        setLog([]);
      }
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(frame);
      if (!session.current && prefs.history && supabase()) {
        try {
          const r = await api("/api/sessions", "POST", {
            mode: modeRef.current,
          });
          if (g === generation.current) session.current = r.id;
          else await api(`/api/sessions/${r.id}/end`, "PATCH", {});
        } catch {
          feedback(
            "Control is ready. History is unavailable until authentication and Flask are configured.",
          );
        }
      }
    } catch (e: any) {
      if(g !== generation.current) return;
      running.current = false;
      release();
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      landmarker.current?.close();
      landmarker.current = null;
      status("Error");
      feedback(
        `${e.name === "NotAllowedError" ? "Camera permission denied. Allow camera access in your browser and try again." : e.message}`,
        true,
      );
    }
  }
  function frame(t: number) {
    if (!stream.current) return;
    if (
      running.current &&
      gestureOn.current &&
      landmarker.current &&
      video.current &&
      video.current.currentTime !== lastFrame.current
    ) {
      try {
        lastFrame.current = video.current.currentTime;
        const r = landmarker.current.detectForVideo(video.current, t);
        if(inputRef.current === "eyes") {
          const categories=r.faceBlendshapes?.[0]?.categories || [];
          const score=(name:string)=>categories.find((c:any)=>c.categoryName===name)?.score || 0;
          // Both eyes must close deliberately; ordinary short blinks do not click.
          eyes.current.frame(r.faceLandmarks?.[0] || null,Math.min(score("eyeBlinkLeft"),score("eyeBlinkRight")),t,eyeScrollRef.current)
            .forEach(a=>dispatchRef.current(a,"eyes"));
          setGesture(eyes.current.state);
          raf.current=requestAnimationFrame(frame); return;
        }
        const hands = r.handedness || [];
        const index = chooseHand(hands,handIdentity.current,handRef.current);
        const identity=index>=0 ? hands[index]?.[0]?.categoryName : null;
        if(identity !== handIdentity.current) {
          engine.current.release().forEach(a=>dispatchRef.current(a));
          dragging.current=false;
          if(modeRef.current === "desktop") void agent.current?.send({type:"RELEASE_ALL"});
          handIdentity.current=identity;
        }
        const l=index>=0 ? r.landmarks[index] : null;
        const c = overlay.current!,
          ctx = c.getContext("2d")!;
        c.width = 640;
        c.height = 480;
        ctx.clearRect(0, 0, 640, 480);
        if (l) {
          ctx.strokeStyle = "#a4e7b0";
          ctx.fillStyle = "#e4ffcd";
          ctx.lineWidth = 2;
          for (const chain of [
            [0, 1, 2, 3, 4],
            [0, 5, 6, 7, 8],
            [5, 9, 10, 11, 12],
            [9, 13, 14, 15, 16],
            [13, 17, 18, 19, 20],
            [0, 17],
          ]) {
            ctx.beginPath();
            chain.forEach((n, i) =>
              i
                ? ctx.lineTo(l[n].x * 640, l[n].y * 480)
                : ctx.moveTo(l[n].x * 640, l[n].y * 480),
            );
            ctx.stroke();
          }
          l.forEach((p: any) => {
            ctx.beginPath();
            ctx.arc(p.x * 640, p.y * 480, 3, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        engine.current
          .frame(l || null, t, toolRef.current === "zoom")
          .forEach((a) => dispatchRef.current(a));
        if (!l) {
          dragging.current = false;
          if (modeRef.current === "desktop")
            void agent.current?.send({ type: "RELEASE_ALL" });
        }
        if (shownGesture.current !== engine.current.state) {
          shownGesture.current = engine.current.state;
          setGesture(engine.current.state + (identity ? ` · ${identity === "Right" ? "Left" : "Right"} hand` : ""));
        }
      } catch (e: any) {
        pause();
        feedback("Tracking failed: " + e.message, true);
      }
    }
    raf.current = requestAnimationFrame(frame);
  }
  async function dispatch(a: Action, source = "gesture") {
    if(a.type === "EYE_SCROLL" || a.type === "EYE_POINTER") {eyeMode(a.type === "EYE_SCROLL"); return;}
    if(a.type === "CALIBRATE_EYES") {eyes.current.reset(); return;}
    if (a.type === "START" || a.type === "RESUME") {
      await start();
      return;
    }
    if (a.type === "PAUSE") {
      pause();
      return;
    }
    if (a.type === "STOP") {
      await stop();
      return;
    }
    if (a.type === "MUTE") {
      mute();
      feedback("Microphone listening stopped.");
      return;
    }
    if (a.type === "HELP") {
      feedback(commands);
      return;
    }
    if (!running.current && a.type !== "MOUSE_UP") return;
    if (a.type === "MOVE_CURSOR") {
      position.current = { x: a.x!, y: a.y! };
      setPos(position.current);
      if(modeRef.current === "browser") highlight();
    }
    if (modeRef.current === "desktop") {
      if (["DASHBOARD","STUDIO"].includes(a.type)) {router.push(a.type === "DASHBOARD" ? "/dashboard" : "/studio"); return;}
      if (a.type === "MOVE_CURSOR") {
        if (agent.current) agent.current.move = a;
        return;
      }
      if (["CLICK","DOUBLE_CLICK","MOUSE_DOWN"].includes(a.type) && agent.current?.move) {
        const move=agent.current.move;agent.current.move=null;await agent.current.send(move);
      }
      const r = await agent.current?.send(a);
      if (!r?.ok) {
        if (
          a.type !== "SET_BRIGHTNESS" &&
          a.type !== "SET_VOLUME" &&
          a.type !== "BRIGHTNESS_STEP" &&
          a.type !== "VOLUME_STEP"
        )
          pause();
        feedback(r?.error || "Agent unavailable", true);
        record(a, "Unsupported", source);
      } else {
        record(a, "Done", source);
        if (source === "voice")
          feedback(`${a.type.replaceAll("_", " ")} executed by the agent.`);
      }
      return;
    }
    if (a.type === "MOVE_CURSOR") {
      if (dragging.current) {
        const box=area.current!.getBoundingClientRect();
        const n = {
          x: clamp((a.x!*window.innerWidth-box.left)/box.width - 0.12, 0, 0.66),
          y: clamp((a.y!*window.innerHeight-box.top)/box.height - 0.12, 0, 0.65),
        };
        noteRef.current = n;
        setNote(n);
      }
      return;
    }
    let result = "Done";
    const p = position.current,
      n = noteRef.current;
    const contains = (el: HTMLElement | null) => {
      if (!el || !area.current) return false;
      const b = area.current.getBoundingClientRect(),
        r = el.getBoundingClientRect(),
        x = p.x * window.innerWidth,
        y = p.y * window.innerHeight;
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const inNote = contains(noteElement.current);
    if (a.type === "MOUSE_DOWN") dragging.current = inNote;
    else if (a.type === "MOUSE_UP") dragging.current = false;
    else if (a.type === "CLICK" || a.type === "DOUBLE_CLICK") {
      if (a.button === "right") {
        feedback("Right click recognized in the practice area.");
      } else {
        const el=hitTarget()?.closest<HTMLElement>('button,a,input,select,[role="button"]');
        if(el && !el.matches(':disabled')) {
          el.focus(); el.click();
          if(a.type === "DOUBLE_CLICK") el.dispatchEvent(new MouseEvent("dblclick",{bubbles:true}));
          feedback("Activated: " + (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0,65));
        } else feedback("Point at a highlighted button or link, then thumbs up, pinch, or blink.");
      }
    } else if (a.type === "SCROLL") {
      let el=hitTarget();
      while(el && !(el.scrollHeight>el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY))) el=el.parentElement;
      (el || document.scrollingElement)?.scrollBy({top:-a.value!,behavior:"instant"});
    } else if (a.type === "ZOOM") {
      setZoom(z=>clamp(z+a.value!,.5,2));
      feedback("Practice objects zoomed. Desktop mode zooms the active application.");
    } else if(a.type === "BACK") router.back();
    else if(a.type === "FORWARD") router.forward();
    else if(a.type === "REFRESH") {router.refresh(); feedback("Page data refreshed; camera session preserved.");}
    else if(a.type === "DASHBOARD") router.push("/dashboard");
    else if(a.type === "STUDIO") router.push("/studio");
    else {
      result = "Unsupported";
      feedback(
        "Desktop agent required for system volume and brightness.",
        true,
      );
    }
    record(a, result, source);
  }
  dispatchRef.current = dispatch;
  function listen() {
    if (listening.current) {
      mute();
      return;
    }
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) {
      feedback(
        "Speech recognition is unsupported here. Try a supported desktop browser.",
        true,
      );
      return;
    }
    const r = new Speech();
    r.lang = prefs.language;
    r.continuous = true;
    r.interimResults = false;
    recognition.current = r;
    const seen = new FinalResults();
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!seen.accept(i, e.results[i].isFinal)) continue;
        const text = e.results[i][0].transcript;
        setPhrase(text);
        const a = intent(text);
        if (a) {
          feedback(`Heard “${text}” → ${a.type.replaceAll("_", " ")}`);
          dispatchRef.current(a, "voice");
        } else
          feedback(
            `“${text}” is not a supported command. Try “What can I say?”`,
            true,
          );
      }
    };
    r.onerror = (e: any) => {
      mute();
      feedback(
        "Microphone: " + e.error + ". Enable listening again when ready.",
        true,
      );
    };
    r.onend = () => {
      listening.current = false;
      setVoice(false);
    };
    try {
      r.start();
      listening.current = true;
      setVoice(true);
      feedback(
        "Listening is on. Speech may be processed by your browser’s recognition service.",
      );
    } catch (e: any) {
      feedback(e.message, true);
    }
  }
  useEffect(() => {
    agent.current = new Agent((s) => {
      setAgentStatus(s);
      if (
        (s === "Agent disconnected" || s.startsWith("Agent paused")) &&
        modeRef.current === "desktop"
      ) {
        running.current = false;
        dragging.current = false;
        engine.current.release();
        status("Paused");
        feedback("Agent disconnected. Desktop actions paused.", true);
      }
    });
    setVoiceAvailable(
      !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      ),
    );
    api("/api/preferences")
      .then((p) => {
        const saved = { ...defaults, ...p };
        setPrefs(saved);
        if (stateRef.current === "Ready") {
          setMode(saved.mode);
          modeRef.current = saved.mode;
          setGestures(saved.gestures);
          gestureOn.current = saved.gestures;
        }
      })
      .catch(() => {});
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") pause();
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    const timer = setInterval(() => {
      if (startTime.current)
        setDuration(Math.floor((Date.now() - startTime.current) / 1000));
      void flush();
    }, 5000);
    return () => {
      generation.current++;
      running.current = false;
      cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      landmarker.current?.close();
      recognition.current?.abort();
      agent.current?.disconnect();
      clearInterval(timer);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      const id = session.current;
      if (id) void api(`/api/sessions/${id}/end`, "PATCH", {}).catch(() => {});
    };
  }, []);
  useEffect(() => {
    engine.current.prefs = prefs;
  }, [prefs]);
  return (
    <>
      {(state === "Running" || state === "Paused") && typeof document !== "undefined" && createPortal(<>
        {state === "Running" && inputMode === "eyes" && !eyes.current.centre && <div className="eye-calibration" aria-live="polite"><span>+</span>Look here · keep your head still</div>}
        {state === "Running" && mode === "browser" && <div className="screen-cursor" style={{left:`${pos.x*100}%`,top:`${pos.y*100}%`}}><MousePointer2 size={25}/></div>}
        <div className="access-dock" aria-label="Hands-free controls">
          <span className="dock-status"><span className="dot"/> {state} · {inputMode === "eyes" ? "Eyes" : "Hands"}</span>
          <button onClick={()=>router.push("/studio")}>Studio</button>
          <button onClick={()=>router.push("/dashboard")}>Dashboard</button>
          <button onClick={()=>router.back()}>← Back</button>
          <button onClick={()=>router.forward()}>Forward →</button>
          <button onClick={()=>{router.refresh();feedback("Page refreshed");}}>Refresh</button>
          {inputMode === "eyes" && <button onClick={()=>eyeMode(!eyeScrollRef.current)}>{eyeScroll ? "Eye pointer" : "Eye scroll"}</button>}
          <button onClick={()=>stateRef.current === "Paused" ? void start() : pause()}>{state === "Paused" ? "Resume" : "Pause"}</button>
          <button className="stop-control" onClick={()=>void stop()}>Stop</button>
        </div>
      </>,document.body)}
      <div style={{display:pathname === "/studio" ? undefined : "none"}}>
      <div className="pagetitle">
        <div>
          <div className="eyebrow">MAKE YOURSELF COMFORTABLE</div>
          <h1>
            Control studio<span style={{ color: "#9caa91" }}>.</span>
          </h1>
          <p>Your hands. Your eyes. Your voice. One connected workspace.</p>
        </div>
        <span className="pill">
          <span className="dot" />
          {state}
        </span>
      </div>
      <div className="studio">
        <div className="studioleft">
          <section className="panel">
            <div className="panelhead">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Camera size={16} /> Your camera
              </span>
              <span className="pill">
                {stream.current ? "Camera active" : "Camera off"}
              </span>
            </div>
            <div className="cameraarea">
              <video ref={video} muted playsInline />
              <canvas ref={overlay} />
              {!stream.current && (
                <div className="cameraempty">
                  <Hand size={52} strokeWidth={1} />
                  <h3>A small gesture starts here.</h3>
                  <p>
                    Find a well-lit spot. Keep your hand visible.
                    <br />
                    We’ll ask for camera access when you start.
                  </p>
                </div>
              )}
              <span className="camerabadge">{gesture}</span>
            </div>
          </section>
          <section className="panel">
            <div className="panelhead">
              <span>Practice playground</span>
              <div className="toolbar">
                <button
                  className={"tool " + (tool === "pointer" ? "selected" : "")}
                  onClick={() => {
                    engine.current.release().forEach(a=>dispatchRef.current(a));
                    toolRef.current = "pointer";
                    setTool("pointer");
                  }}
                >
                  <MousePointer2 size={12} /> Pointer
                </button>
                <button
                  disabled={false}
                  className={"tool " + (tool === "zoom" ? "selected" : "")}
                  onClick={() => {
                    engine.current.release().forEach(a=>dispatchRef.current(a));
                    toolRef.current = "zoom";
                    setTool("zoom");
                  }}
                >
                  <Maximize size={12} /> Zoom {Math.round(zoom * 100)}%
                </button>
                <button
                  className="tool"
                  onClick={() => {
                    setZoom(1);
                    setHits(0);
                    setNote({ x: 0.15, y: 0.55 });
                    noteRef.current = { x: 0.15, y: 0.55 };
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="demoarea" ref={area}>
              <button
                ref={target}
                className="demotarget"
                onClick={() => setHits((h) => h + 1)}
                style={{ transform: `scale(${zoom})` }}
              >
                {hits ? `Connected · ${hits}` : "Point here + thumbs up ↗"}
              </button>
              <div
                ref={noteElement}
                className="sticky"
                style={{
                  left: `${note.x * 100}%`,
                  top: `${note.y * 100}%`,
                  transform: `scale(${zoom})`,
                }}
                onPointerDown={(e) => {
                  if (running.current) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (
                    e.currentTarget.hasPointerCapture(e.pointerId) &&
                    area.current
                  ) {
                    const b = area.current.getBoundingClientRect(),
                      n = {
                        x: clamp((e.clientX - b.left) / b.width - 0.1, 0, 0.66),
                        y: clamp((e.clientY - b.top) / b.height - 0.1, 0, 0.65),
                      };
                    setNote(n);
                    noteRef.current = n;
                  }
                }}
              >
                <b>A little freedom.</b>Hold a pinch
                <br />
                and move me.
              </div>
              <div className="demoscroll" ref={scroll}>
                <h4>A fresh perspective</h4>
                {[
                  "Raise two fingers to scroll.",
                  "Let your hand do the navigating.",
                  "A gentler way to move through your day.",
                  "One small gesture at a time.",
                  "You made it. Scroll back to the start.",
                ].map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              {false && (
                <MousePointer2
                  className="virtualcursor"
                  size={23}
                  fill="#e8f7e2"
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                />
              )}
              <span className="demohint">
                {mode === "browser"
                  ? "IN-BROWSER PRACTICE · Real mouse also supported"
                  : "DESKTOP CONTROL · Actions go to your operating system"}
              </span>
            </div>
          </section>
          <section className="panel">
            <div className="panelhead">
              <span>Recent actions</span>
              <small>
                {duration
                  ? `${Math.floor(duration / 60)}m ${duration % 60}s`
                  : "This session only"}
              </small>
            </div>
            <div className="actionlog">
              {log.length ? (
                log.map((l, i) => (
                  <div key={i}>
                    <span>{l.text}</span>
                    <span>{l.time}</span>
                  </div>
                ))
              ) : (
                <p>No actions yet. Your first gesture will appear here.</p>
              )}
            </div>
          </section>
        </div>
        <aside className="panel controlpanel">
          <h3>Choose how you connect</h3>
          <div className="input-choices">
            {[['hand','✋ Hands'],['eyes','◉ Eyes · beta']].map(([value,label])=><button key={value} className={inputMode===value ? 'selected' : ''} disabled={state === 'Initializing'} onClick={async()=>{
              await stop(); inputRef.current=value;setInputMode(value);gestureOn.current=true;setGestures(true);eyes.current.reset();
            }}>{label}</button>)}
          </div>
          {inputMode === 'hand' ? <label className="field"><span>Preferred hand</span><select value={hand} onChange={e=>{handRef.current=e.target.value;setHand(e.target.value);engine.current.release().forEach(a=>dispatchRef.current(a));handIdentity.current=null;}}><option value="auto">Automatic · either hand</option><option value="left">Left hand</option><option value="right">Right hand</option></select></label> : <div className="eye-help"><strong>Look at the centre when starting</strong><p>Keep your head still during calibration. Look left/right/up/down to steer; look centre to hold. Close BOTH eyes for 0.35–0.9 seconds, then open to click. Ordinary blinks are ignored.</p><button className="tool" onClick={()=>eyes.current.reset()}>Recalibrate eyes</button><button className="tool" onClick={()=>eyeMode(!eyeScrollRef.current)}>{eyeScroll ? 'Use eye pointer' : 'Use eye scrolling'}</button><p>In scroll mode, look at centre for 1.5 seconds to return to pointer. Experimental webcam steering. Lighting, glasses and head movement affect accuracy. Voice works without hands.</p></div>}
          <label className="field">
            <span>Control mode</span>
            <select
              value={mode}
              disabled={state === "Running" || state === "Initializing"}
              onChange={(e) => {
                release();
                modeRef.current = e.target.value;
                setMode(e.target.value);
                toolRef.current = "pointer";
                setTool("pointer");
              }}
            >
              <option value="browser">Website control</option>
              <option value="desktop">Desktop Control</option>
            </select>
          </label>
          <button
            className="button"
            disabled={state === "Initializing" || state === "Running"}
            onClick={() => void start()}
          >
            <Play size={14} />
            {state === "Paused"
              ? "Resume control"
              : state === "Initializing"
                ? "Preparing…"
                : "Start camera & control"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button secondary"
              disabled={state !== "Running"}
              onClick={pause}
            >
              <Pause size={13} /> Pause
            </button>
            <button className="button secondary" onClick={() => void stop()}>
              <Square size={12} /> Stop
            </button>
          </div>
          <div className="separator" />
          <label className="switchrow">
            Camera tracking{" "}
            <input
              type="checkbox"
              checked={gestures}
              onChange={(e) => {
                if (state === "Running") pause();
                gestureOn.current = e.target.checked;
                setGestures(e.target.checked);
              }}
            />
          </label>
          <button
            className="switchrow"
            style={{ width: "100%", border: 0, background: "none" }}
            onClick={listen}
            disabled={!voiceAvailable}
          >
            <span>
              <Mic size={13} style={{ display: "inline", marginRight: 5 }} />
              Voice listening
            </span>
            <span style={{ color: "var(--teal)" }}>
              {voice ? "On · stop" : voiceAvailable ? "Enable" : "Unsupported"}
            </span>
          </button>
          <label className="field">
            <span>Voice language</span>
            <select
              value={prefs.language}
              disabled={voice}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
            </select>
          </label>
          <label className="field">
            <span>
              Cursor sensitivity <b>{prefs.sensitivity.toFixed(1)}×</b>
            </span>
            <input
              aria-label="Cursor sensitivity"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={prefs.sensitivity}
              onChange={(e) =>
                setPrefs({ ...prefs, sensitivity: +e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>
              Movement smoothing{" "}
              <b>{Math.round((1 - prefs.smoothing) * 100)}%</b>
            </span>
            <input
              aria-label="Movement smoothing"
              type="range"
              min="0.1"
              max="0.7"
              step="0.05"
              value={prefs.smoothing}
              onChange={(e) =>
                setPrefs({ ...prefs, smoothing: +e.target.value })
              }
            />
          </label>
          <button
            className="tool"
            disabled={state !== "Running" || gesture === "Tracking lost"}
            onClick={() => {
              engine.current.calibrate();
              feedback("Current fingertip position is now the centre.");
            }}
          >
            Calibrate centre
          </button>
          <button
            className="tool"
            style={{ marginTop: 7 }}
            onClick={() => {
              engine.current.offset = { x: 0, y: 0 };
              feedback("Calibration reset to default mapping.");
            }}
          >
            Reset calibration
          </button>
          <p className="controlnote">
            Index finger: move. Thumbs up (hold): click. Two fingers + vertical movement: scroll under cursor. Three fingers: volume (desktop). Palm held: pause. Fist: stop. Swipe palm: back/forward. Select Zoom for pinch zoom; Pointer for pinch click/drag.
          </p>
          <div className="separator" />
          <h3 style={{ fontSize: 12, marginBottom: 4 }}>Desktop agent</h3>
          <p className="controlnote">{agentStatus}</p>
          {!agent.current?.ready ? (
            <>
              <label className="field">
                <span>Pairing code from the local agent</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={code}
                  placeholder="Enter pairing code"
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    await agent.current?.connect(code);
                    setCode("");
                    feedback(
                      "Agent paired. Select Desktop Control when ready.",
                    );
                  } catch (e: any) {
                    feedback(e.message, true);
                  }
                }}
              >
                Connect agent <ArrowUpRight size={13} />
              </button>
            </>
          ) : (
            <button
              className="button secondary"
              onClick={() => agent.current?.disconnect()}
            >
              Disconnect agent
            </button>
          )}
          <p className="controlnote">
            Run the Windows agent on your computer. Use the localhost setup in
            the project README for desktop control.
          </p>
          <div
            className={"feedback " + (error ? "error" : "")}
            role="status"
            aria-live="polite"
          >
            <strong>
              {phrase ? `Heard: “${phrase}”` : "A little guidance"}
            </strong>
            {message}
          </div>
          <div className="escape">
            <ShieldCheck size={18} />
            <span>
              <kbd>Esc</kbd> pauses this page.
              <br />
              Desktop emergency: Ctrl + Alt + Esc.
            </span>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
