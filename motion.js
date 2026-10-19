// Visual deformation only: this module never changes a Matter body or collider.
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function excite(state, at, strength = 1) {
  state.pulses ??= [];
  state.pulses = state.pulses.filter((p) => at - p.at < 1700).slice(-3);
  state.pulses.push({ at, strength: clamp(strength, 0, 1.25) });
}
export function deformation(
  state,
  time,
  { speed = 0, landed = false, height = 0, phase = 0 } = {},
  reduced = false,
) {
  if (reduced)
    return { sx: 1, sy: 1, bend: 0, ripple: 0, blush: 0, offsetY: 0, phase: 0 };
  let compression = 0,
    bend = 0,
    energy = 0,
    ripple = 0;
  for (const pulse of state.pulses ?? []) {
    const age = time - pulse.at;
    if (age < 0 || age > 1700) continue;
    const envelope = pulse.strength * Math.exp(-age / 460);
    const p = (age * TAU) / 330;
    compression += envelope * Math.cos(p) * 0.23;
    bend += envelope * Math.sin(p) * (2.7 + clamp(height / 47, 0, 16) * 0.13);
    ripple += envelope * Math.sin(p - 0.65) * 0.028;
    energy += envelope;
  }
  const fall = landed ? 0 : clamp(Math.abs(speed) / 19, 0, 1) * 0.13;
  const flutter = landed ? 0 : Math.sin(time / 105 + phase) * fall * 0.12;
  const sx = clamp(
    (1 + compression + flutter) / Math.sqrt(1 + fall),
    0.82,
    1.26,
  );
  const sy = clamp((1 + fall) / (1 + compression + flutter), 0.79, 1.24);
  return {
    sx,
    sy,
    bend: clamp(bend, -5, 5),
    ripple: clamp(ripple, -0.05, 0.05),
    blush: clamp(energy, 0, 1),
    offsetY: landed ? 23 * (1 - sy) : 0,
    phase: (time * TAU) / 330 + phase,
  };
}
// A wave walks only through the active contact graph; nearby free-falling jelly
// is never excited. Each layer receives the wave 42 ms after its neighbour.
export function transmit(source, pairs, time, strength) {
  const visited = new Set([source]);
  const queue = [[source, 0]];
  for (let i = 0; i < queue.length; i++) {
    const [body, depth] = queue[i];
    excite(body.plugin, time + depth * 42, strength * Math.pow(0.76, depth));
    for (const pair of pairs) {
      if (!pair.isActive) continue;
      const next =
        pair.bodyA === body
          ? pair.bodyB
          : pair.bodyB === body
            ? pair.bodyA
            : null;
      if (
        !next ||
        next.label !== "jelly" ||
        !next.plugin.landed ||
        visited.has(next)
      )
        continue;
      visited.add(next);
      queue.push([next, depth + 1]);
    }
  }
}
