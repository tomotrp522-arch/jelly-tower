import { backdrop, star } from "./art.js";
const cache = new Map();
const oval = (c, x, y, rx, ry, fill, rotation = 0) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
};
function cloud(c, x, y, s) {
  for (const [a, b, r] of [
    [-20, 0, 16],
    [-4, -10, 23],
    [18, -3, 19],
    [31, 4, 12],
  ])
    oval(c, x + a * s, y + b * s, r * s, r * s * 0.7, "#ffffffb9");
}
function blossom(c, x, y, r, color) {
  for (let i = 0; i < 5; i++)
    oval(
      c,
      x + Math.cos(i * 1.257) * r,
      y + Math.sin(i * 1.257) * r,
      r * 0.75,
      r * 0.75,
      color,
    );
  oval(c, x, y, r * 0.55, r * 0.55, "#ffdc89");
}
function castle(c, x, y, color) {
  c.fillStyle = color;
  c.fillRect(x - 45, y - 64, 90, 64);
  for (const s of [-1, 1]) {
    c.fillRect(x + s * 42 - 12, y - 94, 24, 94);
    c.beginPath();
    c.moveTo(x + s * 42 - 19, y - 94);
    c.lineTo(x + s * 42, y - 123);
    c.lineTo(x + s * 42 + 19, y - 94);
    c.fillStyle = "#c9a6ef";
    c.fill();
    c.fillStyle = color;
  }
  c.fillStyle = "#fff7e9";
  c.beginPath();
  c.roundRect(x - 10, y - 27, 20, 30, [12, 12, 0, 0]);
  c.fill();
  for (const s of [-1, 1]) {
    c.fillStyle = "#fff5da";
    c.fillRect(x + s * 42 - 4, y - 72, 8, 17);
  }
  c.strokeStyle = "#fff8";
  c.strokeRect(x - 45, y - 64, 90, 64);
}
export function scene(id = "default") {
  if (cache.has(id)) return cache.get(id);
  if (id === "default") {
    const image = backdrop();
    cache.set(id, image);
    return image;
  }
  const image = document.createElement("canvas");
  image.width = 800;
  image.height = 1000;
  const c = image.getContext("2d");
  c.scale(2, 2);
  const colors = {
    candy: ["#ffe1ee", "#fff3e5"],
    "berry-castle": ["#ffe5f3", "#f9c9de"],
    clouds: ["#b9e3ff", "#faf3ff"],
    flowers: ["#def0ec", "#fff0d7"],
    night: ["#444377", "#a995d4"],
    ocean: ["#b5e5f2", "#daf4f4"],
    magic: ["#ddd2fa", "#fff0ed"],
  }[id] ?? ["#ffe1ee", "#fff3e5"];
  const g = c.createLinearGradient(0, 0, 0, 500);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  c.fillStyle = g;
  c.fillRect(0, 0, 400, 500);
  // A translucent center keeps every jelly readable, even in the night theme.
  const glow = c.createRadialGradient(200, 230, 25, 200, 230, 230);
  glow.addColorStop(0, "#ffffff65");
  glow.addColorStop(1, "#ffffff00");
  c.fillStyle = glow;
  c.fillRect(0, 0, 400, 500);
  for (let i = 0; i < 27; i++)
    star(
      c,
      (i * 137 + 21) % 400,
      (i * 79 + 12) % 440,
      i % 5 ? 1.1 : 4,
      "#fff9de",
    );
  if (id === "clouds") {
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = [
        "#f9b1cb",
        "#ffd8a6",
        "#f9eeab",
        "#b8e7d1",
        "#a8d2f2",
        "#d4b8f2",
      ][i];
      c.lineWidth = 7;
      c.beginPath();
      c.arc(200, 196, 148 - i * 7, Math.PI, Math.PI * 2);
      c.stroke();
    }
    for (const [x, y, s] of [
      [27, 178, 1],
      [370, 165, 1.2],
      [30, 370, 1.4],
      [367, 315, 1.1],
      [185, 451, 1.5],
    ])
      cloud(c, x, y, s);
  } else if (id === "berry-castle" || id === "magic") {
    castle(c, 72, 376, id === "magic" ? "#d7c0ed" : "#f4a9c8");
    castle(c, 358, 305, id === "magic" ? "#c3b1e7" : "#f4b9d0");
    for (let i = 0; i < 9; i++) {
      const x = i % 2 ? 365 : 30,
        y = 60 + i * 40;
      star(
        c,
        x,
        y,
        id === "magic" ? 5 : 6,
        id === "magic" ? "#fff3bc" : "#f4a5c6",
        id !== "magic",
      );
    }
    if (id === "berry-castle") {
      for (const x of [26, 370]) {
        oval(c, x, 417, 13, 17, "#ec7c99", 0.2);
        for (let k = 0; k < 6; k++)
          oval(
            c,
            x + (k % 2 ? 5 : -5),
            407 + Math.floor(k / 2) * 8,
            1,
            1.6,
            "#ffebc1",
          );
        oval(c, x, 399, 7, 3, "#a4c68c");
      }
    }
  } else if (id === "night") {
    oval(c, 320, 70, 26, 26, "#fff3bd");
    oval(c, 331, 62, 25, 25, colors[0]);
    for (let i = 0; i < 25; i++)
      star(c, (i * 67 + 17) % 400, (i * 47 + 20) % 450, 2 + (i % 3), "#fff1c8");
    for (const x of [20, 380]) cloud(c, x, 382, 0.9);
  } else if (id === "flowers") {
    for (let i = 0; i < 32; i++) {
      const x = i < 16 ? (i * 23) % 400 : i % 2 ? 22 : 379,
        y = i < 16 ? 445 + (i % 4) * 15 : 50 + (i - 16) * 23;
      blossom(
        c,
        x,
        y,
        4 + (i % 3),
        ["#ffc7dc", "#d2b6f1", "#fff7e6", "#f7d482"][i % 4],
      );
      c.strokeStyle = "#a4c89f";
      c.beginPath();
      c.moveTo(x, y + 6);
      c.lineTo(x - 3, y + 23);
      c.stroke();
    }
    for (const [x, y] of [
      [55, 145],
      [345, 249],
    ]) {
      oval(c, x - 5, y, 6, 10, "#f3b9de", -0.5);
      oval(c, x + 5, y, 6, 10, "#c9b6ed", 0.5);
      c.fillStyle = "#af8b9d";
      c.fillRect(x - 1, y - 6, 2, 14);
    }
  } else if (id === "ocean") {
    for (let i = 0; i < 25; i++) {
      const x = i % 2 ? 15 + ((i * 7) % 40) : 350 + ((i * 9) % 35),
        y = (i * 31) % 450;
      c.strokeStyle = "#ffffffa9";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, y, 3 + (i % 5), 0, 7);
      c.stroke();
    }
    for (const [x, y, color] of [
      [43, 157, "#f5b2cf"],
      [356, 267, "#f4d788"],
      [54, 346, "#b9b0eb"],
    ]) {
      oval(c, x, y, 14, 8, color);
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x + 10, y);
      c.lineTo(x + 23, y - 10);
      c.lineTo(x + 23, y + 10);
      c.fill();
      oval(c, x - 7, y - 2, 1.5, 1.5, "#8b7a9d");
    }
    for (const x of [24, 371]) {
      c.strokeStyle = "#a4cfc2";
      c.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(x + i * 8, 474);
        c.quadraticCurveTo(x + i * 8 - 20, 440, x + i * 8, 396);
        c.stroke();
      }
      for (let i = 0; i < 5; i++)
        oval(c, x + (i - 2) * 4, 476, 4, 13, "#f7d4e2", (i - 2) * 0.3);
    }
  } else if (id === "candy") {
    for (let i = 0; i < 8; i++) {
      const x = i % 2 ? 365 : 30,
        y = 74 + i * 43;
      colorCandy(c, x, y, i);
    }
    for (const [x, y] of [
      [75, 410],
      [328, 390],
    ]) {
      oval(c, x, y, 20, 10, "#d4b5e6");
      c.fillStyle = "#fff0dd";
      c.fillRect(x - 19, y - 2, 38, 4);
      oval(c, x, y - 5, 20, 9, "#f7bfda");
    }
    for (let i = 0; i < 3; i++) {
      oval(c, 35 + i * 29, 457, 16, 13, "#e8bd8c");
      for (let k = 0; k < 4; k++)
        oval(
          c,
          28 + i * 29 + (k % 2) * 9,
          452 + Math.floor(k / 2) * 9,
          1.6,
          1.6,
          "#b7896c",
        );
    }
  }
  oval(c, 200, 474, 160, 20, "#ffffff26");
  cache.set(id, image);
  return image;
}
function colorCandy(c, x, y, i) {
  c.strokeStyle = "#fff7";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + 5, y + 29);
  c.stroke();
  oval(c, x, y, 12, 12, ["#f3abc9", "#b9dce9", "#c7b2e8"][i % 3]);
  c.strokeStyle = "#fff9";
  c.beginPath();
  c.arc(x, y, 7, 0.2, 5);
  c.stroke();
}
