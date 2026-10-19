import test from "node:test";
import assert from "node:assert/strict";
import {
  BPM,
  LOOP_STEPS,
  LOOP_SECONDS,
  musicStep,
  SweetAudio,
} from "../../audio.js";
test("original 16-bar 110 BPM score wraps identically without out-of-key notes", () => {
  assert.equal(BPM, 110);
  assert.equal(LOOP_STEPS, 128);
  assert.ok(LOOP_SECONDS > 34 && LOOP_SECONDS < 35);
  const major = new Set([0, 2, 4, 5, 7, 9, 11]);
  let notes = 0;
  for (let i = 0; i < 256; i++) {
    const events = musicStep(i);
    assert.deepEqual(events, musicStep(i % 128));
    for (const note of events) {
      assert.ok(major.has(note.midi % 12));
      assert.ok(note.duration > 0);
      notes++;
    }
  }
  assert.ok(notes > 250);
  assert.ok(musicStep(0).length > 0);
  assert.ok(musicStep(126).length > 0);
});
test("scheduler crosses two loop boundaries, avoids delayed-tab bursts and rate-limits wobble", () => {
  const events = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
  });
  const context = {
    state: "running",
    currentTime: 0,
    createOscillator() {
      return {
        frequency: param(),
        connect() {},
        disconnect() {},
        start(t) {
          events.push(t);
        },
        stop() {},
      };
    },
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    },
  };
  const music = new SweetAudio();
  music.context = context;
  music.music = {};
  music.effects = {};
  music.nextTime = 0.04;
  for (let i = 0; i < Math.ceil(LOOP_SECONDS * 2 * 40); i++) {
    context.currentTime = i / 40;
    music.schedule();
  }
  assert.ok(events.length > 500);
  for (let i = 1; i < events.length; i++) assert.ok(Number.isFinite(events[i]));
  const count = events.length;
  context.currentTime += 100;
  music.schedule();
  assert.ok(events.length - count < 20);
  assert.equal(music.effect("wobble"), true);
  assert.equal(music.effect("wobble"), false);
  context.currentTime += 1.6;
  assert.equal(music.effect("wobble"), true);
  music.enabled = false;
  assert.equal(music.effect("drop"), false);
  const muted = events.length;
  music.schedule();
  assert.equal(events.length, muted);
});

test("every game cue schedules finite notes and record fanfare is distinct", () => {
  const starts = [],
    pitches = [];
  const param = () => ({
    setValueAtTime(value) {
      pitches.push(value);
    },
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const context = {
    state: "running",
    currentTime: 3,
    createOscillator() {
      return {
        frequency: param(),
        connect() {},
        disconnect() {},
        start(at) {
          starts.push(at);
        },
        stop() {},
      };
    },
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    },
  };
  const audio = new SweetAudio();
  audio.context = context;
  audio.effects = {};
  const counts = {};
  for (const name of [
    "drop",
    "land",
    "wobble",
    "milestone",
    "record",
    "gameover",
  ]) {
    const before = starts.length;
    assert.equal(audio.effect(name), true);
    counts[name] = starts.length - before;
    assert.ok(counts[name] >= 4);
  }
  assert.ok(counts.record > counts.milestone);
  assert.ok(starts.every((at) => Number.isFinite(at) && at > 3 && at < 4));
  assert.ok(pitches.every(Number.isFinite));
});
