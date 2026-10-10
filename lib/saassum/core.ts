export type Action = {
  type: string;
  x?: number;
  y?: number;
  value?: number;
  button?: string;
};
export type Point = { x: number; y: number; z?: number };
export const defaults = {
  sensitivity: 1.25,
  smoothing: 0.28,
  pinch: 0.3,
  debounce: 400,
  hold: 550,
  scroll: 1,
  invert: false,
  language: "en-US",
  history: true,
  gestures: true,
  click: true,
  drag: true,
  scrollEnabled: true,
  mode: "browser",
};
export type Preferences = typeof defaults;
export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export function intent(phrase: string): Action | null {
  const p = phrase
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  const map: Record<string, Action> = {
    "start control": { type: "START" },
    "pause control": { type: "PAUSE" },
    "resume control": { type: "RESUME" },
    "stop session": { type: "STOP" },
    "stop listening": { type: "MUTE" },
    "what can i say": { type: "HELP" },
    click: { type: "CLICK" },
    confirm: { type: "CLICK" },
    "go back": { type: "BACK" },
    "go forward": { type: "FORWARD" },
    refresh: { type: "REFRESH" },
    "open dashboard": { type: "DASHBOARD" },
    "open studio": { type: "STUDIO" },
    "eye scroll": { type: "EYE_SCROLL" },
    "eye pointer": { type: "EYE_POINTER" },
    "calibrate eyes": { type: "CALIBRATE_EYES" },
    "double click": { type: "DOUBLE_CLICK" },
    "right click": { type: "CLICK", button: "right" },
    "scroll up": { type: "SCROLL", value: 240 },
    "scroll down": { type: "SCROLL", value: -240 },
    "zoom in": { type: "ZOOM", value: 0.15 },
    "zoom out": { type: "ZOOM", value: -0.15 },
    "volume up": { type: "VOLUME_STEP", value: 5 },
    "volume down": { type: "VOLUME_STEP", value: -5 },
    "brightness up": { type: "BRIGHTNESS_STEP", value: 5 },
    "brightness down": { type: "BRIGHTNESS_STEP", value: -5 },
  };
  const m = p.match(/^set (volume|brightness) to (\d{1,3})(?: percent|%)?$/);
  return m
    ? { type: "SET_" + m[1].toUpperCase(), value: clamp(Number(m[2]), 0, 100) }
    : map[p] || null;
}
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export class GestureEngine {
  prefs: Preferences;
  state = "Tracking lost";
  down = false;
  pinched = false;
  since = 0;
  lastClick = -Infinity;
  stable = 0;
  pos = { x: 0.5, y: 0.5 };
  prevY: number | null = null;
  zoomBase: number | null = null;
  pose = "";
  poseSince = 0;
  fired = false;
  swipeX = 0;
  volumeY: number | null = null;
  lastVolume = 0;
  offset = { x: 0, y: 0 };
  constructor(prefs = defaults) {
    this.prefs = { ...prefs };
  }
  release(): Action[] {
    const a: Action[] = this.down ? [{ type: "MOUSE_UP" }] : [];
    this.down = false;
    this.pinched = false;
    this.stable = 0;
    this.prevY = null;
    this.zoomBase = null;
    this.pose = "";
    this.fired = false;
    this.volumeY = null;
    this.state = "Tracking lost";
    return a;
  }
  calibrate() {
    this.offset = {
      x: 0.5 - this.pos.x + this.offset.x,
      y: 0.5 - this.pos.y + this.offset.y,
    };
  }
  frame(l: Point[] | null, t: number, zoom = false): Action[] {
    if (!l || l.length < 21) return this.release();
    if (++this.stable < 6) return [];
    const a: Action[] = [];
    const scale = Math.max(dist(l[0], l[9]), 0.03);
    const pinch = dist(l[4], l[8]) / scale;
    const x = clamp(
        (1 - l[8].x - 0.5) * this.prefs.sensitivity + 0.5 + this.offset.x,
      ),
      y = clamp((l[8].y - 0.5) * this.prefs.sensitivity + 0.5 + this.offset.y);
    this.pos = {
      x: this.pos.x + (x - this.pos.x) * this.prefs.smoothing,
      y: this.pos.y + (y - this.pos.y) * this.prefs.smoothing,
    };
    const extended = (tip: number, pip: number) =>
      dist(l[tip], l[0]) > dist(l[pip], l[0]) * 1.15;
    const fingers = [extended(8,6), extended(12,10), extended(16,14), extended(20,18)];
    const thumbUp = l[4].y < l[3].y - scale * .15 && dist(l[4],l[0]) > scale * 1.15;
    const pose = fingers.every(Boolean) ? "palm" : fingers.every(v=>!v) && pinch > this.prefs.pinch + .14 ? (thumbUp ? "confirm" : "fist") : fingers[0] && fingers[1] && fingers[2] && !fingers[3] ? "volume" : "pointer";
    if (pose !== this.pose) { this.pose = pose; this.poseSince = t; this.fired = false; this.swipeX = l[0].x; this.volumeY = null; }
    if (["palm", "fist", "confirm", "volume"].includes(pose)) {
      if(this.down) a.push({type:"MOUSE_UP"});
      this.down=false; this.pinched=false; this.prevY=null; this.zoomBase=null;
      this.state = {pointer:"Tracking",palm:"Open palm · hold to pause / swipe to navigate",fist:"Fist · emergency stop",confirm:"Thumbs up · confirm",volume:"Three fingers · move up/down for volume"}[pose]!;
      if(pose === "palm" && !this.fired && t-this.poseSince < 650 && Math.abs(l[0].x-this.swipeX) > .19) {
        a.push({type:l[0].x > this.swipeX ? "BACK" : "FORWARD"}); this.fired=true;
      } else if (!this.fired && t-this.poseSince >= (pose === "fist" ? 250 : 700) && pose !== "volume") {
        a.push({type:pose === "palm" ? "PAUSE" : pose === "fist" ? "STOP" : "CLICK"}); this.fired=true;
      }
      if(pose === "volume") {
        if(this.volumeY !== null && Math.abs(l[8].y-this.volumeY) > .035 && t-this.lastVolume > 220) {
          a.push({type:"VOLUME_STEP",value:l[8].y < this.volumeY ? 5 : -5}); this.lastVolume=t; this.volumeY=l[8].y;
        }
        if(this.volumeY === null) this.volumeY=l[8].y;
      }
      return a;
    }
    if (zoom) {
      if (this.down) a.push({ type: "MOUSE_UP" });
      this.down = false;
      this.pinched = false;
      this.state = "Zooming";
      if (this.zoomBase !== null)
        a.push({
          type: "ZOOM",
          value: clamp((pinch - this.zoomBase) * 0.6, -0.08, 0.08),
        });
      this.zoomBase = pinch;
      return a;
    }
    this.zoomBase = null;
    const scroll =
      extended(8, 6) && extended(12, 10) && !extended(16, 14) && !this.pinched;
    if (scroll && this.prefs.scrollEnabled) {
      this.state = "Scrolling";
      if(this.down) a.push({type:"MOUSE_UP"});
      this.down=false;
      if (this.prevY !== null) {
        const v =
          (this.prevY - l[8].y) *
          1800 *
          this.prefs.scroll *
          (this.prefs.invert ? -1 : 1);
        if (Math.abs(v) > 2)
          a.push({ type: "SCROLL", value: clamp(v, -300, 300) });
      }
      this.prevY = l[8].y;
      return a;
    }
    this.prevY = null;
    a.push({ type: "MOVE_CURSOR", ...this.pos });
    if (
      !this.pinched &&
      pinch < this.prefs.pinch &&
      t - this.lastClick > this.prefs.debounce
    ) {
      this.pinched = true;
      this.since = t;
      this.state = "Pinching";
    }
    if (this.pinched) {
      if (pinch > this.prefs.pinch + 0.14) {
        if (this.down) a.push({ type: "MOUSE_UP" });
        else if (
          this.prefs.click &&
          t - this.since >= 70 &&
          t - this.since < this.prefs.hold
        )
          a.push({ type: "CLICK" });
        this.lastClick = t;
        this.down = false;
        this.pinched = false;
        this.state = "Tracking";
      } else if (
        this.prefs.drag &&
        t - this.since >= this.prefs.hold &&
        !this.down
      ) {
        this.down = true;
        this.state = "Dragging";
        a.push({ type: "MOUSE_DOWN" });
      }
    } else this.state = "Tracking";
    return a;
  }
}
export class FinalResults {
  seen = new Set<number>();
  accept(index: number, final: boolean) {
    if (!final || this.seen.has(index)) return false;
    this.seen.add(index);
    return true;
  }
}
export function safeNext(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}
