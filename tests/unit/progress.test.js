import test from "node:test";
import assert from "node:assert/strict";
import {
  initialSave,
  apply,
  missionState,
  japanDay,
  migrate,
  ProgressStore,
  SAVE_KEY,
} from "../../progress.js";
import { JELLIES, ACCESSORIES, BACKGROUNDS } from "../../catalog.js";
const before = Date.parse("2026-10-19T14:59:59Z"),
  after = before + 2000;
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
};
test("complete catalog has exact requested prices, six originals and a free background", () => {
  assert.equal(JELLIES.length, 13);
  assert.deepEqual(
    JELLIES.slice(6).map((x) => x.price),
    [100, 250, 300, 350, 500, 800, 1200],
  );
  assert.deepEqual(
    ACCESSORIES.map((x) => x.price),
    [150, 150, 200, 300, 350, 350, 500, 600, 700, 800],
  );
  assert.deepEqual(
    BACKGROUNDS.map((x) => x.price),
    [0, 300, 500, 600, 700, 800, 1000, 1500],
  );
});
test("run events and reward claims are idempotent; balances and earnings are separate", () => {
  const s = initialSave();
  apply(s, { type: "start", run: "one" }, before);
  apply(s, { type: "start", run: "one" }, before);
  apply(s, { type: "stack", run: "one", score: 10 }, before);
  apply(s, { type: "stack", run: "one", score: 10 }, before);
  assert.equal(s.stats.plays, 1);
  assert.equal(s.stats.stacks, 10);
  assert.equal(s.points, 0);
  assert.equal(
    apply(s, { type: "claim", kind: "first", id: "stack-3" }, before).reward,
    30,
  );
  assert.equal(
    apply(s, { type: "claim", kind: "first", id: "stack-3" }, before).ok,
    false,
  );
  apply(s, { type: "claim", kind: "first", id: "stack-10" }, before);
  assert.equal(s.points, 130);
  assert.equal(apply(s, { type: "buy", id: "strawberry" }, before).ok, true);
  assert.equal(s.points, 30);
  assert.equal(s.earned, 130);
  assert.equal(apply(s, { type: "buy", id: "strawberry" }, before).ok, false);
  assert.equal(apply(s, { type: "buy", id: "crown" }, before).ok, false);
  assert.equal(s.points, 30);
});
test("JST daily rollover in a running game preserves past claims and attributes each landing correctly", () => {
  const s = initialSave();
  assert.equal(japanDay(before), "2026-10-19");
  assert.equal(japanDay(after), "2026-10-20");
  apply(s, { type: "stack", run: "midnight", score: 10 }, before);
  apply(s, { type: "claim", kind: "daily", id: "daily-10" }, before);
  apply(s, { type: "stack", run: "midnight", score: 11 }, after);
  assert.equal(s.daily["2026-10-19"].stacks, 10);
  assert.equal(s.daily["2026-10-20"].stacks, 1);
  assert.equal(s.daily["2026-10-20"].plays, 0);
  assert.equal(s.daily["2026-10-20"].best, 11);
  assert.equal(
    apply(s, { type: "claim", kind: "daily", id: "daily-10" }, after).ok,
    false,
  );
  assert.equal(
    apply(s, { type: "claim", kind: "daily", id: "daily-10" }, before).ok,
    false,
  );
  assert.equal(s.points, 30);
});
test("daily completion bonus requires all four goals, independent of reward claim order", () => {
  const s = initialSave();
  for (let i = 0; i < 3; i++)
    apply(s, { type: "stack", run: "r" + i, score: 10 }, before);
  const all = missionState(s, "daily", before).at(-1);
  assert.equal(all.value, 4);
  assert.equal(all.complete, true);
  assert.equal(
    apply(s, { type: "claim", kind: "daily", id: "daily-all" }, before).reward,
    150,
  );
  assert.equal(
    apply(s, { type: "claim", kind: "daily", id: "daily-all" }, before).ok,
    false,
  );
  for (const m of missionState(s, "daily", before).slice(0, 4))
    apply(s, { type: "claim", kind: "daily", id: m.id }, before);
  assert.equal(s.points, 410);
  assert.equal(missionState(s, "daily", after).at(-1).value, 0);
});
test("per-jelly equipment and last-enabled guard enforce ownership; backgrounds do not touch scores", () => {
  const s = initialSave();
  s.points = 3000;
  for (const id of ["pink-bow", "candy", "strawberry"])
    assert.equal(apply(s, { type: "buy", id }).ok, true);
  apply(s, { type: "dress", jelly: "pink", id: "pink-bow" });
  assert.equal(s.accessories.pink, "pink-bow");
  assert.equal(s.accessories.blue, undefined);
  assert.equal(
    apply(s, { type: "dress", jelly: "blue", id: "crown" }).ok,
    false,
  );
  apply(s, { type: "background", id: "candy" });
  assert.equal(s.background, "candy");
  assert.equal(s.stats.best, 0);
  assert.equal(s.stats.backgrounds, 1);
  apply(s, { type: "background", id: "candy" });
  assert.equal(s.stats.backgrounds, 1);
  for (const id of [...s.enabled].slice(1)) apply(s, { type: "toggle", id });
  assert.equal(apply(s, { type: "toggle", id: s.enabled[0] }).ok, false);
  apply(s, { type: "dress", jelly: "pink", id: "" });
  assert.equal(s.accessories.pink, "");
});
test("migration preserves legacy best and sanitises invalid references and negative points", () => {
  const s = migrate(
    {
      points: -1,
      owned: ["crown", "unknown"],
      enabled: [],
      background: "night",
      accessories: { pink: "unowned" },
      stats: { best: 4 },
    },
    23,
  );
  assert.equal(s.stats.best, 23);
  assert.equal(s.points, 0);
  assert.equal(s.background, "default");
  assert.ok(s.enabled.length);
  assert.equal(s.accessories.pink, undefined);
  assert.ok(s.owned.includes("crown"));
  assert.ok(!s.owned.includes("unknown"));
});
test("rapid and cross-store duplicate transactions consume exactly once and survive reopen", async () => {
  const storage = memory();
  storage.setItem("jelly-best", "20");
  const store = new ProgressStore(storage, () => before, null);
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      store.dispatch({ type: "claim", kind: "first", id: "stack-20" }),
    ),
  );
  assert.equal(results.filter((x) => x.ok).length, 1);
  assert.equal(store.state.points, 400);
  const other = new ProgressStore(storage, () => before, null);
  await Promise.all([
    store.dispatch({ type: "buy", id: "strawberry" }),
    other.dispatch({ type: "buy", id: "strawberry" }),
  ]);
  const restored = new ProgressStore(storage, () => after, null);
  assert.equal(restored.state.points, 300);
  assert.equal(restored.state.stats.purchases, 1);
  assert.equal(restored.state.stats.best, 20);
  assert.ok(restored.state.owned.includes("strawberry"));
});
test("storage failures keep a playable in-memory save; future versions remain untouched", async () => {
  const store = new ProgressStore(
    {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("full");
      },
    },
    () => before,
    null,
  );
  await store.dispatch({ type: "stack", run: "r", score: 3 });
  await store.dispatch({ type: "claim", kind: "first", id: "stack-3" });
  assert.equal(store.state.points, 30);
  assert.equal(store.saveError, true);
  const storage = memory();
  const future = JSON.stringify({ version: 99, points: 123 });
  storage.setItem(SAVE_KEY, future);
  const f = new ProgressStore(storage, () => before, null);
  assert.equal((await f.dispatch({ type: "start", run: "x" })).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), future);
});
test("delayed queued events keep their event date across midnight", async () => {
  let now = before,
    release;
  const locks = {
    request: async (name, fn) => {
      await new Promise((r) => (release = r));
      return fn();
    },
  };
  const store = new ProgressStore(memory(), () => now, locks);
  const task = store.dispatch({ type: "stack", run: "late", score: 1 });
  await new Promise((r) => setTimeout(r, 0));
  now = after;
  release();
  await task;
  assert.equal(store.state.daily["2026-10-19"].stacks, 1);
  assert.equal(store.state.daily["2026-10-20"], undefined);
});

test("a corrupt legacy record cannot erase a valid collection save", () => {
  const storage = memory();
  const s = initialSave(14);
  s.points = 250;
  s.owned.push("strawberry");
  storage.setItem(SAVE_KEY, JSON.stringify(s));
  storage.setItem("jelly-best", "broken");
  const store = new ProgressStore(storage, () => before, null);
  assert.equal(store.state.points, 250);
  assert.equal(store.state.stats.best, 14);
  assert.ok(store.state.owned.includes("strawberry"));
});
