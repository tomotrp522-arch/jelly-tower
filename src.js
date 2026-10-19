import Matter from "matter-js";
import "./style.css";
import { SweetAudio } from "./audio.js";
import { deformation, transmit } from "./motion.js";
import { palette, jelly, backdrop, plate, star } from "./art.js";
const { Engine, Bodies, Composite, Events } = Matter;
const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d");
const W = 400,
  H = 500,
  plateY = 428,
  jellyW = 76,
  jellyH = 47;
const colors = palette;
const scenery = backdrop();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let particles = [];
let engine,
  current,
  jellies,
  score,
  over,
  camera,
  targetCamera,
  spawnAt,
  clock = 0,
  last = 0,
  accumulator = 0,
  drag = null;
let recordCelebrated = false;
let best = read("jelly-best", 0),
  sound = read("jelly-sound", true);
const audio = new SweetAudio(sound);
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing may disable storage. */
  }
}
const scoreEl = document.querySelector("#score"),
  bestEl = document.querySelector("#best");
function updateScores() {
  scoreEl.innerHTML = `${score}<span>こ</span>`;
  bestEl.innerHTML = `${best}<span>こ</span>`;
}
function soundButton() {
  const b = document.querySelector("#sound");
  b.textContent = sound ? "♫" : "♪";
  b.setAttribute("aria-pressed", String(sound));
  b.setAttribute(
    "aria-label",
    sound ? "音楽と効果音をオフにする" : "音楽と効果音をオンにする",
  );
  b.style.opacity = sound ? "1" : ".45";
}
function unlockAudio() {
  audio.unlock();
}
function makeCurrent() {
  current = {
    x: 200,
    y: targetCamera + 112,
    color: Math.floor(Math.random() * colors.length),
    expression: Math.floor(Math.random() * 4),
  };
  spawnAt = null;
}
function reset() {
  if (engine) {
    Events.off(engine);
    Engine.clear(engine);
  }
  engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  engine.positionIterations = 8;
  engine.velocityIterations = 8;
  jellies = [];
  particles = [];
  recordCelebrated = false;
  audio.setPlaying(true);
  score = 0;
  over = false;
  camera = targetCamera = 0;
  spawnAt = null;
  clock = 0;
  drag = null;
  accumulator = 0;
  const plate = Bodies.rectangle(200, plateY, 204, 20, {
    isStatic: true,
    chamfer: { radius: 9 },
    label: "plate",
    friction: 0.85,
  });
  Composite.add(engine.world, plate);
  Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      for (const [body, other] of [
        [pair.bodyA, pair.bodyB],
        [pair.bodyB, pair.bodyA],
      ]) {
        if (body.label !== "jelly") continue;
        const j = body.plugin;
        if (
          other.label === "plate" ||
          (other.label === "jelly" && other.plugin.landed)
        ) {
          if (!j.landed) {
            j.landed = true;
            score++;
            const newRecord = score > best;
            if (newRecord) {
              best = score;
              save("jelly-best", best);
            }
            updateScores();
            document.querySelector("#announcement").textContent =
              `${score}こ積めました`;
            spawnAt = clock + 650;
            audio.effect("land");
            if (newRecord && !recordCelebrated) {
              audio.effect("record", 0.2);
              recordCelebrated = true;
            } else if (score === 3 || score === 5 || score % 10 === 0)
              audio.effect("milestone", 0.15);
            if (!reducedMotion) {
              for (let i = 0; i < 12; i++)
                particles.push({
                  x: body.position.x,
                  y: body.position.y + 12,
                  vx: (Math.random() - 0.5) * 2.8,
                  vy: -1 - Math.random() * 2.4,
                  age: 0,
                  life: 650 + Math.random() * 250,
                  heart: i % 3 === 0,
                  color: ["#ff8db8", "#ffdc73", "#fff9e7"][i % 3],
                  size: 2 + Math.random() * 2,
                });
              scoreEl.classList.remove("pop");
              void scoreEl.offsetWidth;
              scoreEl.classList.add("pop");
            }
          }
          if (
            clock - (j.lastImpact ?? -Infinity) > 240 &&
            (j.incomingSpeed > 1.6 || !j.pulses)
          ) {
            const strength = Math.min(1.2, 0.55 + (j.incomingSpeed ?? 0) / 18);
            transmit(body, engine.pairs.list, clock, strength);
            j.lastImpact = clock;
            if (score >= 3 && strength > 0.9) audio.effect("wobble", 0.3);
          }
        }
      }
    }
  });
  updateScores();
  document.querySelector("#gameover").hidden = true;
  document.querySelector("#hint").style.opacity = 1;
  makeCurrent();
}
function drop() {
  if (!current || over) return;
  unlockAudio();
  audio.effect("drop");
  const c = current;
  const b = Bodies.rectangle(c.x, c.y, jellyW, jellyH, {
    chamfer: { radius: 12 },
    friction: 0.72,
    frictionStatic: 1,
    restitution: 0.12,
    density: 0.002,
    frictionAir: 0.008,
    label: "jelly",
    plugin: {
      color: c.color,
      expression: c.expression,
      wobble: 0,
      landed: false,
      dropped: clock,
    },
  });
  jellies.push(b);
  Composite.add(engine.world, b);
  current = null;
  drag = null;
  document.querySelector("#hint").style.opacity = "0";
}
function gameOver() {
  if (over) return;
  over = true;
  audio.setPlaying(false);
  audio.effect("gameover");
  current = null;
  document.querySelector("#result-score").innerHTML = `${score}<span>こ</span>`;
  document.querySelector("#record").textContent =
    score > 0 && score >= best ? "✧ ベストスコア！" : `ベストスコア ${best}こ`;
  document.querySelector("#gameover").hidden = false;
  document.querySelector("#announcement").textContent =
    `ゲームオーバー。スコア ${score}こ`;
  document.querySelector("#retry").focus();
}
function tick(dt) {
  clock += dt;
  for (const b of jellies)
    b.plugin.incomingSpeed = Math.hypot(b.velocity.x, b.velocity.y);
  Engine.update(engine, dt);
  particles = particles.filter((p) => (p.age += dt) < p.life);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.035;
  }
  for (const b of jellies) {
    b.plugin.pulses = (b.plugin.pulses ?? []).filter(
      (p) => clock - p.at < 1700,
    );
    if (b.position.y > plateY + 65 || Math.abs(b.position.x - 200) > 420) {
      gameOver();
    }
    if (!b.plugin.landed && clock - b.plugin.dropped > 9000) gameOver();
  }
  if (!over) {
    const settled = jellies.filter((b) => b.plugin.landed);
    const top = settled.length
      ? Math.min(...settled.map((b) => b.bounds.min.y))
      : plateY;
    targetCamera = Math.min(0, top - 265);
    if (spawnAt !== null && clock >= spawnAt) makeCurrent();
  }
  camera += (targetCamera - camera) * 0.07;
  if (current) current.y = targetCamera + 112;
}
function draw() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  const width = Math.round(r.width * dpr),
    height = Math.round(r.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(scenery, 0, 0, W, H);
  for (let i = 0; i < 12; i++) {
    const x = (i * 137 + 51) % 400,
      y = (((i * 79 + 26 - camera * 0.12) % 390) + 390) % 390;
    ctx.globalAlpha = reducedMotion
      ? 0.55
      : 0.35 + Math.sin(clock / 800 + i) * 0.25;
    star(ctx, x, y, i % 3 === 0 ? 3 : 1.2, "#fffef3");
  }
  ctx.globalAlpha = 1;
  plate(ctx, plateY - camera);
  for (const b of jellies) {
    if (b.position.y - camera < -55 || b.position.y - camera > H + 55) continue;
    jelly(
      ctx,
      b.position.x,
      b.position.y - camera,
      b.angle,
      b.plugin.color,
      0,
      clock,
      b.plugin.expression,
      deformation(
        b.plugin,
        clock,
        {
          speed: b.velocity.y,
          landed: b.plugin.landed,
          height: plateY - b.position.y,
          phase: b.id * 0.7,
        },
        reducedMotion,
      ),
    );
  }
  if (current) {
    ctx.setLineDash([1, 8]);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(current.x, current.y - camera + 32);
    ctx.lineTo(current.x, Math.min(H - 70, plateY - camera - 16));
    ctx.strokeStyle = "#f69ec0a6";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);
    jelly(
      ctx,
      current.x,
      current.y - camera,
      reducedMotion ? 0 : Math.sin(clock / 400) * 0.025,
      current.color,
      reducedMotion ? 0 : 0.14,
      clock,
      current.expression,
    );
  }
  for (const p of particles) {
    ctx.globalAlpha = 1 - p.age / p.life;
    star(ctx, p.x, p.y - camera, p.size, p.color, p.heart);
  }
  ctx.globalAlpha = 1;
}
function frame(now) {
  if (!last) last = now;
  accumulator += Math.min(now - last, 50);
  last = now;
  if (!document.hidden) {
    while (accumulator >= 1000 / 60) {
      if (!over) tick(1000 / 60);
      accumulator -= 1000 / 60;
    }
    draw();
  } else accumulator = 0;
  requestAnimationFrame(frame);
}
function move(event) {
  if (!current) return;
  const r = canvas.getBoundingClientRect();
  current.x = Math.max(
    40,
    Math.min(360, ((event.clientX - r.left) / r.width) * W),
  );
}
canvas.addEventListener("pointerdown", (e) => {
  if (!current || over || drag !== null || !e.isPrimary) return;
  unlockAudio();
  drag = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  move(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId === drag) move(e);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerId === drag) {
    move(e);
    drop();
  }
});
canvas.addEventListener("pointercancel", () => {
  drag = null;
});
canvas.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
    if (current) {
      if (e.key === " ") drop();
      else
        current.x = Math.max(
          40,
          Math.min(360, current.x + (e.key === "ArrowLeft" ? -10 : 10)),
        );
    }
  }
});
document.querySelector("#retry").addEventListener("click", () => {
  unlockAudio();
  reset();
  canvas.focus();
});
document.querySelector("#sound").addEventListener("click", () => {
  sound = !sound;
  save("jelly-sound", sound);
  soundButton();
  audio.setEnabled(sound);
});
document.querySelector("#help").addEventListener("click", (e) => {
  const p = document.querySelector("#instructions");
  p.hidden = !p.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!p.hidden));
});
document.addEventListener("visibilitychange", () => {
  last = 0;
  accumulator = 0;
  audio.setVisible(!document.hidden);
});
// Only trusted user interaction unlocks mobile audio; never autoplay on load.
document.addEventListener("pointerdown", unlockAudio, { passive: true });
document.addEventListener("keydown", (e) => {
  if ([" ", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) unlockAudio();
});
soundButton();
reset();
requestAnimationFrame(frame);
if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => console.warn("Offline registration failed:", error));
  });
