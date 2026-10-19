import Matter from "matter-js";
import "./style.css";
const { Engine, Bodies, Body, Composite, Events } = Matter;
const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d");
const W = 400,
  H = 500,
  plateY = 428,
  jellyW = 76,
  jellyH = 47;
const colors = [
  ["#f0a8c9", "#d97bad"],
  ["#bda6ec", "#9777cf"],
  ["#9dd8ed", "#69b2d4"],
  ["#f4da8c", "#d9b75f"],
  ["#a7ddc8", "#77b99f"],
];
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
  drag = null,
  audio;
let best = read("jelly-best", 0),
  sound = read("jelly-sound", true);
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
    sound ? "効果音をオフにする" : "効果音をオンにする",
  );
  b.style.opacity = sound ? "1" : ".45";
}
function unlockAudio() {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume().catch(() => {});
  } catch {}
}
function plop() {
  if (!sound || !audio) return;
  const t = audio.currentTime,
    o = audio.createOscillator(),
    g = audio.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(680, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.14);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
  o.connect(g);
  g.connect(audio.destination);
  o.start(t);
  o.stop(t + 0.2);
}
function makeCurrent() {
  current = {
    x: 200,
    y: targetCamera + 112,
    color: Math.floor(Math.random() * colors.length),
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
            if (score > best) {
              best = score;
              save("jelly-best", best);
            }
            updateScores();
            document.querySelector("#announcement").textContent =
              `${score}こ積めました`;
            spawnAt = clock + 650;
            plop();
          }
          j.wobble = 1;
          for (const b of jellies)
            if (b !== body) b.plugin.wobble = Math.max(b.plugin.wobble, 0.35);
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
  const c = current;
  const b = Bodies.rectangle(c.x, c.y, jellyW, jellyH, {
    chamfer: { radius: 12 },
    friction: 0.72,
    frictionStatic: 1,
    restitution: 0.12,
    density: 0.002,
    frictionAir: 0.008,
    label: "jelly",
    plugin: { color: c.color, wobble: 0, landed: false, dropped: clock },
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
  Engine.update(engine, dt);
  for (const b of jellies) {
    b.plugin.wobble *= 0.94;
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
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function drawJelly(x, y, angle, color, wobble = 0, ghost = false) {
  ctx.save();
  ctx.translate(x, y - camera);
  ctx.rotate(angle);
  const t = clock / 70;
  const squash = Math.sin(t) * wobble * 0.12;
  ctx.scale(1 + squash, 1 - squash);
  const [base, edge] = colors[color];
  ctx.shadowColor = edge + "40";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 7;
  const g = ctx.createLinearGradient(0, -24, 0, 24);
  g.addColorStop(0, base + "dd");
  g.addColorStop(0.55, base + "ed");
  g.addColorStop(1, edge + "ee");
  roundRect(-38, -23.5, 76, 47, [17, 17, 14, 14]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = edge + "99";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  roundRect(-30, -19, 60, 15, 10);
  ctx.fillStyle = "#ffffff39";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-22, -12, 8, 3, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "#fff9";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(25, 12, 3, 5, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff45";
  ctx.fill();
  ctx.fillStyle = "#65527888";
  ctx.beginPath();
  ctx.arc(-10, 3, 1.8, 0, 7);
  ctx.arc(10, 3, 1.8, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 5, 4, 0, Math.PI);
  ctx.strokeStyle = "#65527877";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (ghost) {
    ctx.strokeStyle = "#fff9";
    ctx.lineWidth = 1;
    roundRect(-35, -21, 70, 42, 15);
    ctx.stroke();
  }
  ctx.restore();
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
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#ede6f8");
  bg.addColorStop(0.7, "#f6edf4");
  bg.addColorStop(1, "#f5eee9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 23; i++) {
    const x = (i * 137 + 31) % 400,
      y = (((i * 79 + 40 - camera * 0.25) % 500) + 500) % 500;
    ctx.fillStyle = i % 2 ? "#ffffff8c" : "#c8b6d63b";
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 2 : 1.2, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff55";
  ctx.beginPath();
  ctx.ellipse(30, 210 - camera * 0.12, 65, 27, -0.3, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(385, 310 - camera * 0.12, 60, 30, 0.2, 0, 7);
  ctx.fill();
  const py = plateY - camera;
  ctx.fillStyle = "#d5c1d629";
  ctx.beginPath();
  ctx.ellipse(200, py + 27, 108, 12, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#d7c9df";
  roundRect(157, py + 7, 86, 12, 6);
  ctx.fill();
  ctx.fillStyle = "#fff9";
  roundRect(95, py - 9, 210, 17, 10);
  ctx.fill();
  ctx.strokeStyle = "#c8b6d5";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(200, py - 7, 97, 8, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#e3d7e9";
  ctx.stroke();
  for (const b of jellies)
    drawJelly(
      b.position.x,
      b.position.y,
      b.angle,
      b.plugin.color,
      b.plugin.wobble,
    );
  if (current) {
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(current.x, current.y - camera + 35);
    ctx.lineTo(current.x, Math.min(H - 70, py - 16));
    ctx.strokeStyle = "#b49bc04a";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    drawJelly(
      current.x,
      current.y,
      Math.sin(clock / 400) * 0.025,
      current.color,
      0.14,
      true,
    );
    ctx.fillStyle = "#a58bb5";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ここから、ぷるん。", current.x, current.y - camera - 39);
  }
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
  unlockAudio();
});
document.querySelector("#help").addEventListener("click", (e) => {
  const p = document.querySelector("#instructions");
  p.hidden = !p.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!p.hidden));
});
document.addEventListener("visibilitychange", () => {
  last = 0;
  accumulator = 0;
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
