// Original composition: "Sugar Window", C major, 110 BPM, 16 bars in 4/4.
// Every event is synthesised locally. No samples, services or runtime downloads.
export const BPM = 110;
export const STEP = 60 / BPM / 2;
export const LOOP_STEPS = 16 * 8;
export const LOOP_SECONDS = LOOP_STEPS * STEP;
const melody = [
  [76, -1, 79, 81, 79, 76, 74, -1],
  [72, 76, 79, -1, 76, 74, 72, -1],
  [77, -1, 81, 84, 81, 79, 77, -1],
  [79, 77, 74, -1, 71, 74, 79, -1],
  [76, 79, 84, -1, 83, 81, 79, 76],
  [76, -1, 79, 83, 81, 79, 76, -1],
  [77, 81, 79, 77, 76, 74, 72, -1],
  [74, -1, 79, 77, 74, 71, 72, -1],
  [79, -1, 84, 86, 84, 81, 79, -1],
  [81, 79, 76, -1, 79, 76, 72, -1],
  [81, -1, 84, 88, 86, 84, 81, -1],
  [83, 81, 79, -1, 77, 74, 71, -1],
  [76, 79, 84, 79, 81, 79, 76, -1],
  [77, 81, 84, -1, 81, 77, 74, -1],
  [79, 77, 74, 71, 74, 77, 79, -1],
  [76, -1, 74, -1, 72, -1, -1, -1],
];
const chords = [
  [48, 64, 67],
  [45, 60, 64],
  [53, 65, 69],
  [43, 62, 67],
  [48, 64, 67],
  [52, 64, 71],
  [50, 65, 69],
  [43, 62, 67],
  [48, 64, 67],
  [45, 60, 64],
  [53, 65, 69],
  [43, 62, 67],
  [48, 64, 67],
  [53, 65, 69],
  [43, 62, 67],
  [48, 64, 67],
];
export function musicStep(step) {
  const index = ((step % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS;
  const bar = Math.floor(index / 8),
    beat = index % 8,
    notes = [];
  if (melody[bar][beat] >= 0)
    notes.push({
      midi: melody[bar][beat],
      duration: 0.38,
      volume: 0.085,
      voice: bar % 4 === 2 ? "bell" : "marimba",
      offset: 0,
    });
  if (beat === 0 || beat === 4)
    notes.push({
      midi: chords[bar][0],
      duration: 0.62,
      volume: 0.085,
      voice: "piano",
      offset: 0,
    });
  if (beat === 2 || beat === 6)
    for (const [i, midi] of chords[bar].slice(1).entries())
      notes.push({
        midi,
        duration: 0.55,
        volume: 0.038,
        voice: "piano",
        offset: i * 0.025,
      });
  return notes;
}
export function tone(
  context,
  destination,
  { midi, duration = 0.4, volume = 0.1, voice = "bell", offset = 0 },
  when,
) {
  const at = when + offset,
    frequency = 440 * 2 ** ((midi - 69) / 12);
  const partials =
    voice === "bell"
      ? [
          [1, 1],
          [2.01, 0.25],
          [3.98, 0.08],
        ]
      : voice === "marimba"
        ? [
            [1, 1],
            [3.99, 0.13],
          ]
        : [
            [1, 1],
            [2, 0.18],
            [3, 0.06],
          ];
  for (const [ratio, level] of partials) {
    const oscillator = context.createOscillator(),
      envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * ratio, at);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume * level, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    envelope.gain.linearRampToValueAtTime(0, at + duration + 0.03);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.04);
  }
}
const effects = {
  drop: [
    [76, 0, 0.18],
    [81, 0.065, 0.23],
  ],
  land: [
    [72, 0, 0.22],
    [79, 0.07, 0.28],
    [76, 0.14, 0.27],
  ],
  wobble: [
    [69, 0, 0.1],
    [72, 0.1, 0.1],
    [69, 0.2, 0.13],
  ],
  milestone: [
    [84, 0, 0.34],
    [88, 0.1, 0.36],
    [91, 0.2, 0.45],
    [96, 0.32, 0.55],
  ],
  record: [
    [79, 0, 0.3],
    [84, 0.1, 0.35],
    [88, 0.2, 0.4],
    [91, 0.3, 0.55],
    [96, 0.45, 0.75],
    [88, 0.45, 0.65],
  ],
  gameover: [
    [76, 0, 0.23],
    [72, 0.16, 0.3],
    [67, 0.34, 0.4],
    [60, 0.55, 0.62],
  ],
};
export class SweetAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.active = true;
    this.visible = true;
    this.lastEffect = new Map();
  }
  unlock() {
    if (!this.enabled || !this.visible) return;
    try {
      if (!this.context) {
        const Context =
          globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) return;
        const c = (this.context = new Context());
        this.master = c.createGain();
        this.music = c.createGain();
        this.effects = c.createGain();
        const limiter = c.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.knee.value = 12;
        limiter.ratio.value = 5;
        limiter.attack.value = 0.006;
        limiter.release.value = 0.18;
        this.master.gain.value = 0.7;
        this.music.gain.value = this.active ? 0.22 : 0.045;
        this.effects.gain.value = 0.52;
        this.music.connect(this.master);
        this.effects.connect(this.master);
        this.master.connect(limiter);
        limiter.connect(c.destination);
        c.onstatechange = () => {
          if (c.state === "running" && this.enabled && this.visible)
            this.start();
          else this.stop();
        };
      }
      this.master.gain.setTargetAtTime(0.7, this.context.currentTime, 0.025);
      if (this.context.state !== "running")
        this.context
          .resume()
          .then(() => this.start())
          .catch(() => {});
      else this.start();
    } catch {
      /* Sound is optional; gameplay continues when audio is unavailable. */
    }
  }
  start() {
    if (
      this.timer !== null ||
      !this.enabled ||
      !this.visible ||
      this.context?.state !== "running"
    )
      return;
    this.nextTime = this.context.currentTime + 0.04;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }
  schedule() {
    const c = this.context;
    if (!c || c.state !== "running" || !this.enabled || !this.visible) return;
    // After a throttled tab, resume near now instead of bursting missed notes.
    if (this.nextTime < c.currentTime - 0.05)
      this.nextTime = c.currentTime + 0.04;
    while (this.nextTime < c.currentTime + 0.18) {
      for (const note of musicStep(this.step))
        tone(c, this.music, note, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % LOOP_STEPS;
    }
  }
  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.unlock();
    else {
      this.stop();
      if (this.context)
        this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.018);
    }
  }
  setPlaying(active) {
    this.active = active;
    if (this.context)
      this.music.gain.setTargetAtTime(
        active ? 0.22 : 0.045,
        this.context.currentTime,
        active ? 0.18 : 0.45,
      );
  }
  setVisible(visible) {
    this.visible = visible;
    if (!visible) {
      this.stop();
      this.context?.suspend().catch(() => {});
    } else if (this.context && this.enabled) this.unlock();
  }
  effect(name, delay = 0) {
    const c = this.context;
    if (!this.enabled || !this.visible || c?.state !== "running") return false;
    const cooldown = name === "wobble" ? 1.5 : name === "land" ? 0.12 : 0.08;
    if (c.currentTime - (this.lastEffect.get(name) ?? -Infinity) < cooldown)
      return false;
    this.lastEffect.set(name, c.currentTime);
    for (const [midi, offset, duration] of effects[name] ?? [])
      tone(
        c,
        this.effects,
        {
          midi,
          offset: offset + delay,
          duration,
          volume: name === "wobble" ? 0.07 : 0.14,
          voice:
            name === "drop" || name === "land" || name === "gameover"
              ? "marimba"
              : "bell",
        },
        c.currentTime + 0.012,
      );
    return true;
  }
}
