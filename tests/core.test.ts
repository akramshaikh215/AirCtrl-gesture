import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GestureEngine,
  intent,
  FinalResults,
  safeNext,
} from "../lib/saassum/core.ts";
function hand(pinched = false, scroll = false) {
  const l = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6 }));
  l[0] = { x: 0.5, y: 0.9 };
  l[9] = { x: 0.5, y: 0.6 };
  l[8] = { x: 0.4, y: 0.3 };
  l[6] = { x: 0.4, y: 0.5 };
  l[4] = { x: pinched ? 0.41 : 0.65, y: 0.3 };
  l[12] = { x: 0.5, y: scroll ? 0.25 : 0.65 };
  l[10] = { x: 0.5, y: 0.5 };
  return l;
}
function ready() {
  const e = new GestureEngine();
  for (let i = 0; i < 6; i++) e.frame(hand(), i * 20);
  return e;
}
test("short pinch clicks once on release", () => {
  const e = ready();
  const a = [
    ...e.frame(hand(true), 200),
    ...e.frame(hand(true), 300),
    ...e.frame(hand(), 400),
    ...e.frame(hand(), 420),
  ];
  assert.equal(a.filter((x) => x.type === "CLICK").length, 1);
});
test("held pinch drags once and releases without click", () => {
  const e = ready();
  const a = [
    ...e.frame(hand(true), 200),
    ...e.frame(hand(true), 800),
    ...e.frame(hand(true), 850),
    ...e.frame(hand(), 900),
  ];
  assert.equal(a.filter((x) => x.type === "MOUSE_DOWN").length, 1);
  assert.equal(a.filter((x) => x.type === "MOUSE_UP").length, 1);
  assert.ok(!a.some((x) => x.type === "CLICK"));
});
test("tracking loss releases and requires stable reacquisition", () => {
  const e = ready();
  e.frame(hand(true), 200);
  e.frame(hand(true), 800);
  assert.equal(e.frame(null, 850)[0].type, "MOUSE_UP");
  assert.deepEqual(e.frame(hand(true), 900), []);
});
test("scroll and zoom suppress click and movement", () => {
  const e = ready();
  assert.ok(
    !e
      .frame(hand(false, true), 200)
      .some((x) => ["CLICK", "MOUSE_DOWN", "MOVE_CURSOR"].includes(x.type)),
  );
  e.frame(hand(), 300, true);
  assert.ok(e.frame(hand(true), 400, true).every((x) => x.type === "ZOOM"));
});
test("allowlisted voice intents clamp values and reject arbitrary text", () => {
  assert.deepEqual(intent("Set volume to 140 percent."), {
    type: "SET_VOLUME",
    value: 100,
  });
  assert.equal(intent("run powershell"), null);
  assert.equal(intent("click on whatever"), null);
});
test("final recognition results execute once per index", () => {
  const f = new FinalResults();
  assert.equal(f.accept(0, false), false);
  assert.equal(f.accept(0, true), true);
  assert.equal(f.accept(0, true), false);
  assert.equal(f.accept(1, true), true);
});
test("return destinations are internal", () => {
  assert.equal(safeNext("//evil.com"), "/dashboard");
  assert.equal(safeNext("/\\evil.com"), "/dashboard");
  assert.equal(safeNext("/studio"), "/studio");
});
