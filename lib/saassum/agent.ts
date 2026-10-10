import type { Action } from "./core";
export class Agent {
  ws: WebSocket | null = null;
  seq = 0;
  ready = false;
  timer: ReturnType<typeof setInterval> | null = null;
  move: Action | null = null;
  pending = new Map<number, (r: any) => void>();
  constructor(public status: (s: string) => void) {}
  connect(code: string) {
    return new Promise<void>((resolve, reject) => {
      this.disconnect();
      const ws = new WebSocket("ws://127.0.0.1:8765");
      this.ws = ws;
      const timeout = setTimeout(() => {
        ws.close();
        reject(
          new Error(
            "Agent pairing timed out. Start the Windows agent and check the code.",
          ),
        );
      }, 8000);
      ws.onopen = () => ws.send(JSON.stringify({ type: "PAIR", code }));
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(
          new Error(
            "Cannot reach local agent. Use the documented localhost setup.",
          ),
        );
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        this.ready = false;
        if (this.timer) clearInterval(this.timer);
        this.pending.forEach((fn) =>
          fn({ ok: false, error: "Agent disconnected" }),
        );
        this.pending.clear();
        this.status("Agent disconnected");
      };
      ws.onmessage = (e) => {
        const r = JSON.parse(e.data);
        if (r.type === "PAIRED") {
          clearTimeout(timeout);
          this.ready = true;
          this.seq = 0;
          this.status("Connected · " + r.capabilities.join(", "));
          let beat = 0;
          this.timer = setInterval(() => {
            if (this.move && this.ws?.bufferedAmount === 0) {
              const m = this.move;
              this.move = null;
              void this.send(m);
            }
            if (++beat % 20 === 0) void this.send({ type: "HEARTBEAT" });
          }, 50);
          resolve();
        } else if (r.type === "ERROR" && !this.ready) {
          clearTimeout(timeout);
          reject(new Error(r.error));
          ws.close();
        } else {
          const f = this.pending.get(r.seq);
          if (f) {
            this.pending.delete(r.seq);
            f(r);
          } else if (r.ok === false) {
            this.status("Agent paused · " + r.error);
          }
        }
      };
    });
  }
  async send(a: Action): Promise<any> {
    if (!this.ready || !this.ws)
      return { ok: false, error: "Desktop agent is not connected" };
    const seq = ++this.seq;
    this.ws.send(JSON.stringify({ ...a, seq, expires: Date.now() + 1200 }));
    if (a.type === "MOVE_CURSOR" || a.type === "HEARTBEAT")
      return { ok: true, queued: true };
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        this.pending.delete(seq);
        resolve({ ok: false, error: "Agent did not acknowledge action" });
      }, 2000);
      this.pending.set(seq, (r) => {
        clearTimeout(t);
        resolve(r);
      });
    });
  }
  release() {
    this.move = null;
    if (this.ready) void this.send({ type: "PAUSE" });
  }
  disconnect() {
    this.release();
    this.ready = false;
    if (this.timer) clearInterval(this.timer);
    this.ws?.close();
    this.ws = null;
  }
}
