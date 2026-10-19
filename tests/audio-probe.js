// Observe the real Web Audio graph without replacing its sound generation.
export async function observeAudio(page) {
  await page.addInitScript(() => {
    const Native = window.AudioContext || window.webkitAudioContext;
    window.__audio = [];
    if (!Native) return;
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        this.events = [];
        this.gains = [];
        window.__audio.push(this);
      }
      createGain() {
        const node = super.createGain();
        this.gains.push(node);
        const connect = node.connect.bind(node);
        node.connect = (to, ...args) => {
          node.target = to;
          return connect(to, ...args);
        };
        return node;
      }
      createOscillator() {
        const node = super.createOscillator();
        let envelope;
        const connect = node.connect.bind(node),
          start = node.start.bind(node);
        node.connect = (to, ...args) => {
          envelope = to;
          return connect(to, ...args);
        };
        node.start = (at) => {
          this.events.push({
            at,
            created: this.currentTime,
            channel: envelope?.target === this.gains[2] ? "effect" : "music",
          });
          return start(at);
        };
        return node;
      }
      createDynamicsCompressor() {
        const node = super.createDynamicsCompressor();
        this.output = node;
        return node;
      }
    };
  });
}
export async function readRms(page) {
  return page.evaluate(async () => {
    const context = window.__audio[0];
    if (!context.analyser) {
      context.analyser = context.createAnalyser();
      context.analyser.fftSize = 2048;
      context.output.connect(context.analyser);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    const data = new Float32Array(2048);
    context.analyser.getFloatTimeDomainData(data);
    return Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
  });
}
