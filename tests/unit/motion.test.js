import test from "node:test";
import assert from "node:assert/strict";
import Matter from "matter-js";
import { excite, deformation, transmit } from "../../motion.js";
test("landing compresses, rebounds four times and settles, with bounded volume", () => {
  const state = {};
  excite(state, 0, 1);
  const impact = deformation(state, 0, { landed: true });
  assert.ok(impact.sx > 1.2);
  assert.ok(impact.sy < 0.85);
  assert.ok(impact.blush > 0.9);
  assert.ok(deformation(state, 165, { landed: true }).sy > 1.1);
  let reversals = 0,
    last = 0;
  for (let t = 0; t <= 1600; t += 10) {
    const m = deformation(state, t, { landed: true, height: 500 });
    assert.ok(m.sx >= 0.82 && m.sx <= 1.26);
    assert.ok(m.sy >= 0.79 && m.sy <= 1.24);
    assert.ok(Math.abs(m.sx * m.sy - 1) < 0.035);
    const sign = Math.sign(m.bend);
    if (sign && last && sign !== last) reversals++;
    if (sign) last = sign;
  }
  assert.ok(reversals >= 6 && reversals <= 10);
  const settled = deformation(state, 1800, { landed: true });
  assert.equal(settled.sx, 1);
  assert.equal(settled.sy, 1);
  assert.equal(settled.blush, 0);
});
test("fall stretches with velocity; reduced motion removes visual deformation", () => {
  const slow = deformation({}, 200, { speed: 2 }),
    fast = deformation({}, 200, { speed: 18 });
  assert.ok(fast.sy > slow.sy);
  assert.ok(fast.sx < slow.sx);
  const state = {};
  excite(state, 0);
  assert.deepEqual(deformation(state, 100, { speed: 20, height: 900 }, true), {
    sx: 1,
    sy: 1,
    bend: 0,
    ripple: 0,
    blush: 0,
    offsetY: 0,
    phase: 0,
  });
});
test("contact waves propagate with delay, avoiding inactive or unrelated bodies", () => {
  const a = { label: "jelly", plugin: { landed: true } },
    b = { label: "jelly", plugin: { landed: true } },
    c = { label: "jelly", plugin: { landed: true } },
    free = { label: "jelly", plugin: { landed: false } },
    other = { label: "jelly", plugin: { landed: true } };
  const pair = (a, b, isActive = true) => ({ bodyA: a, bodyB: b, isActive });
  transmit(
    a,
    [
      pair(a, b),
      pair(b, c),
      pair(c, a, false),
      pair(a, free),
      pair(a, other, false),
    ],
    50,
    1,
  );
  assert.equal(a.plugin.pulses[0].at, 50);
  assert.equal(b.plugin.pulses[0].at, 92);
  assert.equal(c.plugin.pulses[0].at, 134);
  assert.ok(c.plugin.pulses[0].strength < b.plugin.pulses[0].strength);
  assert.equal(free.plugin.pulses, undefined);
  assert.equal(other.plugin.pulses, undefined);
});
test("stronger height response does not change physical bodies or simulation", () => {
  const { Engine, Bodies, Composite } = Matter;
  function run(visual) {
    const engine = Engine.create();
    const floor = Bodies.rectangle(200, 428, 204, 20, {
      isStatic: true,
      friction: 0.85,
    });
    const body = Bodies.rectangle(200, 112, 76, 47, {
      chamfer: { radius: 12 },
      friction: 0.72,
      frictionStatic: 1,
      restitution: 0.12,
      density: 0.002,
      frictionAir: 0.008,
    });
    Composite.add(engine.world, [floor, body]);
    const before = JSON.stringify(body.vertices.map((v) => [v.x, v.y]));
    for (let i = 0; i < 300; i++) {
      Engine.update(engine, 1000 / 60);
      if (visual) {
        excite(body.plugin, i * 16, 1);
        deformation(body.plugin, i * 16, {
          speed: body.velocity.y,
          landed: i > 55,
          height: 428 - body.position.y,
        });
      }
    }
    return [
      body.position.x,
      body.position.y,
      body.angle,
      body.velocity.x,
      body.velocity.y,
      before,
    ];
  }
  assert.deepEqual(run(true), run(false));
  const state = {};
  excite(state, 0);
  assert.ok(
    Math.abs(deformation(state, 90, { height: 700 }).bend) >
      Math.abs(deformation(state, 90, { height: 0 }).bend),
  );
});
