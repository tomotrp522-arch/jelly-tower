const ellipse = (c, x, y, rx, ry, color, rotation = 0) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
};
export function drawAccessory(c, id, x = 0, y = -25, scale = 1) {
  if (!id) return;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.lineWidth = 1;
  c.strokeStyle = "#fff9";
  if (id.includes("bow")) {
    const color =
      id === "red-bow"
        ? "#ec5b79"
        : id === "rainbow-bow"
          ? "#b7a0ed"
          : "#f597c3";
    let fill = color;
    if (id === "rainbow-bow") {
      fill = c.createLinearGradient(-16, 0, 16, 0);
      ["#ff9fbd", "#ffe693", "#abdfbd", "#9bcefc", "#c7a0ed"].forEach((x, i) =>
        fill.addColorStop(i / 4, x),
      );
    }
    c.fillStyle = fill;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(s * 23, -18, s * 23, 16, 0, 0);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(s * 2, 2);
      c.lineTo(s * 10, 14);
      c.lineTo(s * 3, 11);
      c.closePath();
      c.fill();
    }
    ellipse(c, 0, 0, 3.5, 4, "#ffe3ed");
  } else if (id === "flower") {
    for (let i = 0; i < 5; i++)
      ellipse(
        c,
        Math.cos(i * 1.256) * 6,
        Math.sin(i * 1.256) * 6,
        4.5,
        4.5,
        "#fff4fc",
      );
    ellipse(c, 0, 0, 3.5, 3.5, "#ffcf66");
    ellipse(c, 10, 6, 3, 7, "#a2ce96", -0.8);
  } else if (id === "berry-hat") {
    c.fillStyle = "#f37595";
    c.beginPath();
    c.moveTo(-14, 0);
    c.quadraticCurveTo(-10, -26, 0, -23);
    c.quadraticCurveTo(14, -21, 15, 0);
    c.closePath();
    c.fill();
    for (let i = 0; i < 7; i++)
      ellipse(
        c,
        ((i % 3) - 1) * 6,
        -5 - Math.floor(i / 3) * 6,
        0.8,
        1.3,
        "#ffedb9",
      );
    for (const s of [-1, 0, 1])
      ellipse(c, s * 4, -22, 2.5, 6, "#a1c67c", s * 0.6);
    ellipse(c, 0, 0, 18, 3, "#ffd6e2");
  } else if (id === "bunny") {
    for (const s of [-1, 1]) {
      ellipse(c, s * 10, -13, 6, 18, "#fff6f6", s * 0.18);
      ellipse(c, s * 10, -15, 2.6, 12, "#f5adc9", s * 0.18);
    }
    ellipse(c, 0, 1, 19, 3, "#ffdfec");
  } else if (id === "cat") {
    for (const s of [-1, 1]) {
      c.fillStyle = "#c5a3e0";
      c.beginPath();
      c.moveTo(s * 4, 1);
      c.lineTo(s * 19, -18);
      c.quadraticCurveTo(s * 26, -5, s * 23, 3);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffd0e0";
      c.beginPath();
      c.moveTo(s * 12, -1);
      c.lineTo(s * 19, -11);
      c.lineTo(s * 21, 0);
      c.fill();
    }
  } else if (id === "crown") {
    const g = c.createLinearGradient(0, -21, 0, 2);
    g.addColorStop(0, "#fff4ac");
    g.addColorStop(1, "#e7ac42");
    c.fillStyle = g;
    c.strokeStyle = "#d9973c";
    c.beginPath();
    c.moveTo(-16, 0);
    c.lineTo(-20, -20);
    c.lineTo(-8, -10);
    c.lineTo(0, -26);
    c.lineTo(8, -10);
    c.lineTo(20, -20);
    c.lineTo(16, 0);
    c.closePath();
    c.fill();
    c.stroke();
    for (const [x, y] of [
      [-20, -20],
      [0, -26],
      [20, -20],
    ])
      ellipse(c, x, y, 2.5, 2.5, "#ffe99d");
    ellipse(c, 0, -5, 3, 3, "#ef9dc5");
    c.fillStyle = "#fff3b3";
    c.fillRect(-16, -1, 32, 4);
  } else if (id === "halo") {
    c.shadowColor = "#ffe38d";
    c.shadowBlur = 8;
    c.strokeStyle = "#efd277";
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, -14, 18, 5, 0, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = "#fff9db";
    c.lineWidth = 1;
    c.stroke();
  } else if (id === "wizard") {
    c.fillStyle = "#9b83ce";
    c.beginPath();
    c.moveTo(-15, 0);
    c.quadraticCurveTo(-4, -24, 5, -34);
    c.quadraticCurveTo(10, -20, 16, 0);
    c.closePath();
    c.fill();
    c.stroke();
    ellipse(c, 0, 1, 23, 4, "#bfa4eb");
    c.fillStyle = "#ffe39c";
    c.font = "12px serif";
    c.fillText("✦", -3, -9);
  }
  c.restore();
}
