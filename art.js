import { drawAccessory } from "./accessories.js";
// All scenery and characters are drawn locally; no external images or fonts.
export const palette = [
  ["#ffafd6", "#f3589f"],
  ["#c8a2ff", "#9b51e6"],
  ["#a3eaff", "#4aaff1"],
  ["#fff09b", "#f4b938"],
  ["#d5f59a", "#91c945"],
  ["#ffc694", "#ff8a42"],
  ["#ffbdcf", "#f56290"],
  ["#ffe9a1", "#e6b657"],
  ["#b8f3ff", "#49b8df"],
  ["#d6b4ff", "#9559cf"],
  ["#ffe0ed", "#e9a2c0"],
  ["#b4b4ff", "#6864ba"],
  ["#ffc5e1", "#b995e3"],
];
const TAU = Math.PI * 2;
function ellipse(c, x, y, rx, ry, fill, rotation = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, TAU);
  c.fillStyle = fill;
  c.fill();
}
export function star(c, x, y, r, fill, heart = false) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  if (heart) {
    c.moveTo(0, r * 0.8);
    c.bezierCurveTo(-r * 1.8, -r * 0.2, -r * 0.6, -r * 1.4, 0, -r * 0.45);
    c.bezierCurveTo(r * 0.6, -r * 1.4, r * 1.8, -r * 0.2, 0, r * 0.8);
  } else {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        s = i % 2 ? r * 0.46 : r;
      c.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    }
    c.closePath();
  }
  c.fillStyle = fill;
  c.fill();
  c.restore();
}
function jellyPath(c) {
  c.beginPath();
  c.moveTo(-34, 19);
  c.bezierCurveTo(-42, 14, -36, -4, -32, -13);
  c.bezierCurveTo(-28, -23, -17, -25, -9, -22);
  c.bezierCurveTo(-3, -26, 6, -25, 12, -22);
  c.bezierCurveTo(23, -24, 30, -19, 33, -10);
  c.bezierCurveTo(36, -1, 41, 16, 33, 20);
  c.bezierCurveTo(25, 25, 16, 23, 10, 23);
  c.bezierCurveTo(1, 26, -8, 24, -14, 23);
  c.bezierCurveTo(-22, 24, -29, 24, -34, 19);
  c.closePath();
}
function paintJelly(c, x, y, angle, color, expression = 0, blush = false) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(1, 0.94);
  const [light, dark] = palette[color];
  c.shadowColor = dark + "40";
  c.shadowBlur = 7;
  c.shadowOffsetY = 3;
  const g = c.createLinearGradient(-12, -25, 12, 26);
  if (color === 12) {
    ["#ffd0df", "#ffe9a7", "#c7efcc", "#b7e5fa", "#d7b8f3"].forEach((v, i) =>
      g.addColorStop(i / 4, v),
    );
  } else {
    g.addColorStop(0, "#fff9");
    g.addColorStop(0.17, light + "ee");
    g.addColorStop(0.52, dark + "c9");
    g.addColorStop(0.85, light + "ed");
    g.addColorStop(1, "#fff9");
  }
  jellyPath(c);
  c.fillStyle = g;
  c.fill();
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = dark;
  c.lineWidth = 1.1;
  c.stroke();
  c.save();
  c.clip();
  const glow = c.createRadialGradient(-10, -8, 1, 0, 0, 38);
  glow.addColorStop(0, "#ffffff65");
  glow.addColorStop(0.7, "#ffffff00");
  glow.addColorStop(1, dark + "25");
  c.fillStyle = glow;
  c.fillRect(-40, -28, 80, 56);
  // Ingredient patterns stay clipped inside the same glossy body silhouette.
  if (color === 6)
    for (let i = 0; i < 14; i++)
      ellipse(
        c,
        -26 + ((i * 17) % 53),
        -13 + ((i * 11) % 31),
        0.65,
        1.1,
        "#fff3ac",
        0.4,
      );
  if (color === 7) {
    c.fillStyle = "#bd794edb";
    c.beginPath();
    c.moveTo(-35, -23);
    c.lineTo(35, -23);
    c.lineTo(31, -10);
    c.bezierCurveTo(16, -16, 10, -6, 0, -12);
    c.bezierCurveTo(-12, -17, -22, -7, -33, -12);
    c.closePath();
    c.fill();
  }
  if (color === 8)
    for (let i = 0; i < 10; i++) {
      c.beginPath();
      c.arc(-28 + ((i * 19) % 56), -15 + ((i * 13) % 34), 1 + (i % 3), 0, TAU);
      c.strokeStyle = "#ffffffa8";
      c.lineWidth = 0.7;
      c.stroke();
    }
  if (color === 9)
    for (const x of [-25, 24])
      for (const [dx, dy] of [
        [-2, -2],
        [2, -2],
        [0, 2],
      ])
        ellipse(c, x + dx, -8 + dy, 2, 2, "#b581daaa");
  if (color === 10)
    for (let i = 0; i < 8; i++)
      ellipse(
        c,
        -26 + ((i * 17) % 52),
        -15 + ((i * 11) % 33),
        2,
        3,
        "#f69fb69c",
        i * 0.7,
      );
  if (color === 11)
    for (let i = 0; i < 9; i++)
      star(c, -26 + ((i * 19) % 52), -13 + ((i * 11) % 31), 1.6, "#fff1af");
  if (color === 12)
    for (const [x, y] of [
      [-25, -10],
      [24, 10],
      [-22, 14],
    ])
      star(c, x, y, 2, "#fffef0");
  for (const offset of [-27, -17, 20, 29]) {
    c.beginPath();
    c.moveTo(offset * 0.77, -18);
    c.bezierCurveTo(offset * 0.95, -10, offset * 1.07, 7, offset * 1.13, 17);
    c.strokeStyle = "#fff5";
    c.lineWidth = offset === -27 ? 3.5 : 2;
    c.stroke();
  }
  c.restore();
  c.save();
  c.scale(0.94, 0.9);
  jellyPath(c);
  c.strokeStyle = "#ffffffd9";
  c.lineWidth = 1.2;
  c.stroke();
  c.restore();
  c.beginPath();
  c.moveTo(-26, -16);
  c.bezierCurveTo(-13, -24, 10, -24, 25, -15);
  c.strokeStyle = "#fff9";
  c.lineWidth = 1.7;
  c.stroke();
  ellipse(c, -22, -13, 6, 2.8, "#fff", -0.65);
  ellipse(c, 22, -12, 3.7, 7, "#fffe", -0.45);
  ellipse(c, 28, -2, 1.4, 2.4, "#fff");
  ellipse(c, -12, -20, 1.4, 0.8, "#fff");
  ellipse(c, 8, -19, 1.1, 1.5, "#fff");
  ellipse(c, 0, 17, 24, 4, "#ffffff28");
  ellipse(c, -23, 18, 9, 2, "#fff9");
  ellipse(c, 23, 18, 7, 2, "#fffb", -0.2);
  const ink = color === 1 ? "#77469e" : color === 2 ? "#496fa9" : "#a04d61";
  ellipse(
    c,
    -17,
    8,
    4.1,
    2.8,
    blush ? "#ff648dc9" : color === 6 ? "#f76a8da9" : "#ff8fb49c",
  );
  ellipse(
    c,
    17,
    8,
    4.1,
    2.8,
    blush ? "#ff648dc9" : color === 6 ? "#f76a8da9" : "#ff8fb49c",
  );
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineWidth = 1.5;
  c.lineCap = "round";
  for (const side of [-1, 1]) {
    const ex = side * 11;
    if (expression === 2 || (expression === 1 && side === 1)) {
      c.beginPath();
      c.moveTo(ex - 2.4, 0);
      c.lineTo(ex + 1.5, 2.3);
      c.lineTo(ex - 2.4, 4.8);
      c.stroke();
    } else {
      ellipse(c, ex, 2, 2.6, 3.6, ink);
      ellipse(c, ex - 0.6, 0.8, 0.8, 1.1, "#fff");
    }
  }
  c.beginPath();
  if (expression === 3) {
    c.ellipse(0, 9, 3, 3.6, 0, 0, TAU);
  } else {
    c.moveTo(-4.6, 7);
    c.quadraticCurveTo(-2, 9, 0, 7.8);
    c.quadraticCurveTo(2, 9, 4.6, 7);
    c.bezierCurveTo(4, 15, -4, 15, -4.6, 7);
  }
  c.fillStyle = "#f27c99";
  c.fill();
  c.stroke();
  c.restore();
}
// Cached high-resolution sprites are warped in thin horizontal bands. This
// deforms silhouette, gloss and face together, with a delayed wave at the top.
const sprites = new Map();
function sprite(color, expression, blush) {
  const key = `${color}:${expression}:${blush}`;
  if (!sprites.has(key)) {
    const image = document.createElement("canvas");
    image.width = 300;
    image.height = 240;
    const c = image.getContext("2d");
    c.scale(3, 3);
    if (blush) {
      c.translate(50, 40);
      c.scale(1, 0.94);
      ellipse(c, -17, 8, 4.6, 3.1, "#ff56777a");
      ellipse(c, 17, 8, 4.6, 3.1, "#ff56777a");
    } else paintJelly(c, 50, 40, 0, color, expression);
    sprites.set(key, image);
  }
  return sprites.get(key);
}
let warpCanvas, warpContext;
export function jelly(
  c,
  x,
  y,
  angle,
  color,
  wobble,
  time,
  expression = 0,
  motion = null,
  accessory = "",
) {
  const idle = Math.cos(time / 125) * wobble * 0.08;
  const m = motion ?? {
    sx: 1 + idle,
    sy: 1 - idle,
    bend: 0,
    ripple: 0,
    blush: 0,
    offsetY: 0,
    phase: 0,
  };
  const normal = sprite(color, expression, false);
  c.save();
  c.translate(x, y + m.offsetY);
  c.rotate(angle);
  if (m.blush < 0.01 && Math.abs(m.bend) < 0.1) {
    c.scale(m.sx, m.sy);
    c.drawImage(normal, -50, -40, 100, 80);
    drawAccessory(c, accessory, 0, -25);
    c.restore();
    return;
  }
  if (!warpCanvas) {
    warpCanvas = document.createElement("canvas");
    warpCanvas.width = 360;
    warpCanvas.height = 330;
    warpContext = warpCanvas.getContext("2d");
  }
  const w = warpContext;
  w.clearRect(0, 0, 360, 330);
  const rosy = m.blush > 0.01 ? sprite(color, expression, true) : null;
  // Rasterise to integer pixel rows BEFORE rotation or screen scaling. Adjacent
  // translucent bands then share exact edges, avoiding visible horizontal seams.
  const first = Math.max(0, Math.ceil((55 - 40 * m.sy) * 3));
  const end = Math.min(330, Math.floor((55 + 40 * m.sy) * 3));
  for (let row = first; row < end; row++) {
    const localY = (row / 3 - 55) / m.sy,
      sourceY = (localY + 40) * 3;
    const v = Math.max(0, Math.min(1, (localY + 24) / 48)),
      lag = (1 - v) * 0.95;
    const shift =
      m.bend * (0.2 + 0.8 * (1 - v)) +
      m.blush * 0.8 * (1 - v) * Math.sin(m.phase - lag);
    const width =
      m.sx *
      (1 + m.ripple * Math.sin(m.phase - lag) + m.blush * 0.025 * v * v * v);
    const dx = 180 - 150 * width + shift * 3,
      dw = 300 * width;
    w.drawImage(normal, 0, sourceY, 300, 1 / m.sy, dx, row, dw, 1);
    if (rosy) {
      w.globalAlpha = m.blush;
      w.drawImage(rosy, 0, sourceY, 300, 1 / m.sy, dx, row, dw, 1);
      w.globalAlpha = 1;
    }
  }
  c.drawImage(warpCanvas, -60, -55, 120, 110);
  c.save();
  c.translate(m.bend + m.blush * 0.8 * Math.sin(m.phase - 0.95), -25 * m.sy);
  c.rotate(m.bend * 0.012);
  c.scale(m.sx, m.sy);
  drawAccessory(c, accessory, 0, 0);
  c.restore();
  c.restore();
}
function cloud(c, x, y, size = 1) {
  c.save();
  c.filter = "blur(1.5px)";
  c.translate(x, y);
  c.scale(size, size);
  for (const [a, b, r] of [
    [-23, 0, 16],
    [-9, -8, 20],
    [11, -5, 20],
    [29, 2, 13],
  ])
    ellipse(c, a, b, r, r * 0.77, "#fff9");
  c.restore();
}
function flower(c, x, y, size = 1) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5;
    ellipse(c, Math.cos(a) * 5, Math.sin(a) * 5, 4, 4, "#fff8f3");
  }
  ellipse(c, 0, 0, 2.5, 2.5, "#ffdc83");
  c.restore();
}
function strawberry(c, x, y, s = 1, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(s, s);
  const g = c.createLinearGradient(-8, -7, 8, 12);
  g.addColorStop(0, "#ff9eb0");
  g.addColorStop(0.5, "#f96b87");
  g.addColorStop(1, "#e94e72");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 13);
  c.bezierCurveTo(-21, 1, -10, -14, 0, -8);
  c.bezierCurveTo(11, -15, 19, 1, 0, 13);
  c.fill();
  for (let i = 0; i < 9; i++)
    ellipse(
      c,
      ((i % 3) - 1) * 5,
      Math.floor(i / 3) * 5 - 4,
      0.7,
      1,
      "#ffe6b1",
      -0.3,
    );
  for (let i = 0; i < 3; i++)
    ellipse(c, (i - 1) * 4, -8, 2, 5, "#9cbe77", (i - 1) * 0.8);
  ellipse(c, -5, -4, 2, 3, "#fff7", 0.5);
  c.restore();
}
function bow(c, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#f6a5c7";
  c.strokeStyle = "#fff9";
  c.lineWidth = 1.3;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(side * 27, -25, side * 28, 19, 0, 0);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(side * 3, 1);
    c.lineTo(side * 14, 23);
    c.lineTo(side * 5, 20);
    c.lineTo(side * 1, 23);
    c.closePath();
    c.fill();
  }
  ellipse(c, 0, 0, 4, 5, "#ffd5e6");
  c.restore();
}
export function backdrop() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  const bg = c.createLinearGradient(0, 0, 0, 500);
  bg.addColorStop(0, "#ffe3ed");
  bg.addColorStop(1, "#fff0e7");
  c.fillStyle = bg;
  c.fillRect(0, 0, 400, 500);
  // A softly glowing shop window, with a clear center for play.
  c.save();
  c.beginPath();
  c.roundRect(50, 19, 300, 414, [150, 150, 8, 8]);
  c.clip();
  const sky = c.createLinearGradient(0, 20, 0, 425);
  sky.addColorStop(0, "#a8d8ff");
  sky.addColorStop(0.5, "#d1eaff");
  sky.addColorStop(1, "#ffdfeb");
  c.fillStyle = sky;
  c.fillRect(40, 0, 320, 440);
  for (const [x, y, r, color] of [
    [90, 270, 90, "#ffd6ee"],
    [310, 330, 100, "#ffd9ed"],
    [215, 210, 100, "#ffffff"],
    [180, 70, 80, "#e4d6ff"],
  ]) {
    const haze = c.createRadialGradient(x, y, 0, x, y, r);
    haze.addColorStop(0, color + "a6");
    haze.addColorStop(1, color + "00");
    c.fillStyle = haze;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  cloud(c, 113, 136, 1.1);
  cloud(c, 303, 217, 1.5);
  cloud(c, 94, 287, 1.2);
  cloud(c, 258, 351, 1.2);
  c.restore();
  c.beginPath();
  c.roundRect(48, 16, 304, 420, [154, 154, 10, 10]);
  c.strokeStyle = "#fff5d9";
  c.lineWidth = 8;
  c.stroke();
  c.strokeStyle = "#f2c5c9";
  c.lineWidth = 2;
  c.stroke();
  for (const side of [-1, 1]) {
    c.save();
    if (side === 1) {
      c.translate(400, 0);
      c.scale(-1, 1);
    }
    const curtain = c.createLinearGradient(0, 0, 65, 0);
    curtain.addColorStop(0, "#efa6c4");
    curtain.addColorStop(0.25, "#ffe2e9");
    curtain.addColorStop(0.55, "#f9b7cd");
    curtain.addColorStop(1, "#ffe8dd");
    c.fillStyle = curtain;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(94, 0);
    c.bezierCurveTo(42, 65, 46, 199, 42, 323);
    c.lineTo(0, 395);
    c.closePath();
    c.fill();
    c.strokeStyle = "#fff6";
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(21 + i * 13, 0);
      c.quadraticCurveTo(7 + i * 12, 133, 15 + i * 8, 321);
      c.stroke();
    }
    c.restore();
  }
  // Gingham counter.
  c.fillStyle = "#ffe5eb";
  c.fillRect(0, 414, 400, 86);
  c.save();
  c.beginPath();
  c.rect(0, 414, 400, 86);
  c.clip();
  c.translate(200, 410);
  c.rotate(-0.22);
  for (let i = -12; i < 13; i++) {
    c.fillStyle = "#f8b5cd48";
    c.fillRect(i * 26, -90, 13, 260);
    c.fillRect(-260, i * 26, 520, 13);
  }
  c.restore();
  const mist = c.createLinearGradient(0, 355, 0, 450);
  mist.addColorStop(0, "#fff0");
  mist.addColorStop(1, "#fff6");
  c.fillStyle = mist;
  c.fillRect(0, 355, 400, 95);
  // Peripheral confectionery, flowers and a ribbon-tied candy jar.
  c.globalAlpha = 0.66;
  jelly(c, 18, 321, -0.07, 1, 0, 0, 2);
  jelly(c, 53, 320, 0.07, 3, 0, 0, 0);
  ellipse(c, 28, 345, 53, 8, "#fff9f1");
  c.strokeStyle = "#edc3c5";
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = "#fff2eb";
  c.fillRect(20, 349, 9, 38);
  ellipse(c, 25, 388, 27, 6, "#fff8f1");
  c.fillStyle = "#fff6";
  c.beginPath();
  c.roundRect(342, 331, 61, 99, 12);
  c.fill();
  c.strokeStyle = "#fff9";
  c.stroke();
  for (let i = 0; i < 11; i++)
    ellipse(
      c,
      352 + ((i * 17) % 43),
      369 + ((i * 19) % 51),
      7,
      8,
      ["#ffb6d1", "#d2b2fa", "#a7e1fa", "#ffe79d"][i % 4],
      i,
    );
  c.fillStyle = "#fff9";
  c.fillRect(341, 328, 62, 8);
  bow(c, 369, 342, 0.8);
  c.globalAlpha = 1;
  for (const [x, y, s] of [
    [14, 279, 1.1],
    [32, 272, 0.8],
    [373, 291, 1],
    [390, 281, 0.9],
    [21, 465, 1.1],
    [378, 472, 1.2],
  ]) {
    ellipse(c, x - 5, y + 8, 4, 9, "#b1ca91", -0.7);
    ellipse(c, x + 5, y + 7, 4, 9, "#aacb91", 0.7);
    flower(c, x, y, s);
  }
  strawberry(c, 338, 455, 1.35, 0.35);
  strawberry(c, 382, 485, 1.8, 0.2);
  strawberry(c, 43, 434, 0.85, -0.3);
  bow(c, 30, 202, 0.55);
  bow(c, 370, 102, 0.5);
  for (let i = 0; i < 32; i++) {
    const x = (i * 137 + 21) % 400,
      y = (i * 79 + 42) % 420;
    if (x > 120 && x < 280) continue;
    const r = i % 4 === 0 ? 5 : 1.4;
    star(c, x, y, r, i % 3 ? "#fffce7" : "#ffe6a2");
  }
  star(c, 88, 173, 10, "#fff0a8");
  star(c, 320, 254, 9, "#ffe6a9");
  star(c, 329, 146, 7, "#b4e7ff");
  return canvas;
}
export function plate(c, y) {
  c.save();
  c.translate(200, y);
  ellipse(c, 0, 20, 123, 14, "#d88ca82b");
  ellipse(c, 0, 8, 116, 22, "#eebbc8");
  const g = c.createLinearGradient(0, -18, 0, 23);
  g.addColorStop(0, "#fffefa");
  g.addColorStop(0.6, "#fff7f4");
  g.addColorStop(1, "#f4cfda");
  ellipse(c, 0, 0, 123, 25, g);
  c.strokeStyle = "#e9bb87";
  c.lineWidth = 1;
  c.stroke();
  for (let i = 0; i < 20; i++) {
    const a = (i * TAU) / 20;
    ellipse(
      c,
      Math.cos(a) * 111,
      Math.sin(a) * 19,
      13,
      6,
      "#fffaf6",
      Math.sin(a) * 0.35,
    );
    c.strokeStyle = "#f4d4dc";
    c.lineWidth = 0.6;
    c.stroke();
  }
  ellipse(c, 0, 0, 91, 15, "#fce4ee");
  c.strokeStyle = "#e8b5ce";
  c.stroke();
  ellipse(c, 0, -2, 80, 11, "#fff2f5");
  c.strokeStyle = "#fff";
  c.stroke();
  c.restore();
}
