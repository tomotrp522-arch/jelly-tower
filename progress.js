import {
  JELLIES,
  ACCESSORIES,
  BACKGROUNDS,
  BY_ID,
  FREE,
  FIRST_MISSIONS,
  DAILY_MISSIONS,
} from "./catalog.js";
export const SAVE_KEY = "jelly-progress";
export const SAVE_VERSION = 1;
const num = (n) =>
  Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1_000_000_000) : 0;
const ids = (list, allowed) => [
  ...new Set(
    Array.isArray(list) ? list.filter((x) => allowed.includes(x)) : [],
  ),
];
export const japanDay = (now = Date.now()) =>
  new Date(Number(now) + 9 * 3600000).toISOString().slice(0, 10);
const daily = () => ({ stacks: 0, plays: 0, best: 0, claimed: [] });
export function initialSave(legacyBest = 0) {
  return {
    version: 1,
    revision: 0,
    points: 0,
    earned: 0,
    owned: [...FREE],
    enabled: JELLIES.filter((x) => !x.price).map((x) => x.id),
    accessories: {},
    background: "default",
    stats: {
      best: num(legacyBest),
      stacks: 0,
      plays: 0,
      purchases: 0,
      dresses: 0,
      backgrounds: 0,
    },
    claimed: [],
    daily: {},
    runs: {},
  };
}
export function migrate(raw, legacyBest = 0) {
  const s = initialSave(legacyBest);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return s;
  s.revision = num(raw.revision);
  s.points = num(raw.points);
  s.earned = Math.max(s.points, num(raw.earned));
  s.owned = [...new Set([...FREE, ...ids(raw.owned, Object.keys(BY_ID))])];
  s.enabled = ids(
    raw.enabled,
    JELLIES.map((x) => x.id),
  ).filter((x) => s.owned.includes(x));
  if (!s.enabled.length) s.enabled = ["pink"];
  s.background =
    BACKGROUNDS.some((x) => x.id === raw.background) &&
    s.owned.includes(raw.background)
      ? raw.background
      : "default";
  for (const j of JELLIES) {
    const a = raw.accessories?.[j.id];
    if (ACCESSORIES.some((x) => x.id === a) && s.owned.includes(a))
      s.accessories[j.id] = a;
  }
  for (const key of Object.keys(s.stats))
    s.stats[key] = Math.max(s.stats[key], num(raw.stats?.[key]));
  s.claimed = ids(
    raw.claimed,
    FIRST_MISSIONS.map((x) => x.id),
  );
  if (raw.daily && typeof raw.daily === "object")
    for (const [day, d] of Object.entries(raw.daily))
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && d && typeof d === "object")
        s.daily[day] = {
          stacks: num(d.stacks),
          plays: num(d.plays),
          best: num(d.best),
          claimed: ids(
            d.claimed,
            DAILY_MISSIONS.map((x) => x.id),
          ),
        };
  if (raw.runs && typeof raw.runs === "object")
    for (const [id, r] of Object.entries(raw.runs))
      if (/^[a-zA-Z0-9-]{1,100}$/.test(id) && r && typeof r === "object")
        s.runs[id] = { score: num(r.score) };
  return s;
}
export function missionState(save, kind, now = Date.now()) {
  const day = japanDay(now),
    d = save.daily[day] ?? daily();
  const missions = kind === "daily" ? DAILY_MISSIONS : FIRST_MISSIONS,
    stats = kind === "daily" ? d : save.stats,
    claimed = kind === "daily" ? d.claimed : save.claimed;
  return missions.map((m) => {
    const value =
      m.metric === "all"
        ? DAILY_MISSIONS.slice(0, 4).filter((x) => (d[x.metric] ?? 0) >= x.goal)
            .length
        : (stats[m.metric] ?? 0);
    return {
      ...m,
      value: Math.min(value, m.goal),
      complete: value >= m.goal,
      claimed: claimed.includes(m.id),
    };
  });
}
export function apply(save, action, now = Date.now()) {
  const day = japanDay(now);
  save.daily[day] ??= daily();
  const d = save.daily[day];
  switch (action.type) {
    case "start": {
      if (Object.hasOwn(save.runs, action.run))
        return { ok: true, duplicate: true };
      if (!/^[a-zA-Z0-9-]{1,100}$/.test(action.run ?? ""))
        return { ok: false, message: "プレイを確認できませんでした。" };
      save.runs[action.run] = { score: 0 };
      save.stats.plays++;
      d.plays++;
      break;
    }
    case "stack": {
      if (!Object.hasOwn(save.runs, action.run)) {
        const r = apply(save, { type: "start", run: action.run }, now);
        if (!r.ok) return r;
      }
      const run = save.runs[action.run],
        score = num(action.score);
      if (score <= run.score) return { ok: true, duplicate: true };
      const delta = score - run.score;
      run.score = score;
      save.stats.stacks += delta;
      d.stacks += delta;
      save.stats.best = Math.max(save.stats.best, score);
      d.best = Math.max(d.best, score);
      break;
    }
    case "claim": {
      const m = missionState(save, action.kind, now).find(
        (x) => x.id === action.id,
      );
      if (!m || !m.complete || m.claimed)
        return {
          ok: false,
          message: "この報酬はまだ受け取れないか、受取済みです。",
        };
      (action.kind === "daily" ? d.claimed : save.claimed).push(m.id);
      save.points += m.reward;
      save.earned += m.reward;
      return { ok: true, reward: m.reward, message: `+${m.reward}P 獲得！` };
    }
    case "buy": {
      const product = BY_ID[action.id];
      if (!product || !product.price)
        return { ok: false, message: "商品が見つかりません。" };
      if (save.owned.includes(product.id))
        return { ok: false, message: "購入済みのアイテムです。" };
      if (save.points < product.price)
        return { ok: false, message: "ポイントが足りません。" };
      save.points -= product.price;
      save.owned.push(product.id);
      save.stats.purchases++;
      return {
        ok: true,
        purchased: product.id,
        message: `${product.name}をコレクションに追加！`,
      };
    }
    case "toggle": {
      if (
        !JELLIES.some((x) => x.id === action.id) ||
        !save.owned.includes(action.id)
      )
        return { ok: false, message: "未購入のゼリーです。" };
      if (save.enabled.includes(action.id)) {
        if (save.enabled.length === 1)
          return { ok: false, message: "ゼリーは1種類以上ONにしてください。" };
        save.enabled = save.enabled.filter((x) => x !== action.id);
      } else save.enabled.push(action.id);
      break;
    }
    case "dress": {
      if (
        !JELLIES.some((x) => x.id === action.jelly) ||
        !save.owned.includes(action.jelly)
      )
        return { ok: false, message: "未購入のゼリーです。" };
      if (
        action.id &&
        (!ACCESSORIES.some((x) => x.id === action.id) ||
          !save.owned.includes(action.id))
      )
        return { ok: false, message: "アクセサリーをショップで手に入れてね。" };
      if (save.accessories[action.jelly] === action.id)
        return { ok: true, duplicate: true };
      save.accessories[action.jelly] = action.id;
      if (action.id) save.stats.dresses++;
      break;
    }
    case "background": {
      if (
        !BACKGROUNDS.some((x) => x.id === action.id) ||
        !save.owned.includes(action.id)
      )
        return { ok: false, message: "未購入の背景です。" };
      if (save.background !== action.id) {
        save.background = action.id;
        save.stats.backgrounds++;
      }
      break;
    }
    default:
      return { ok: false, message: "操作を確認できませんでした。" };
  }
  return { ok: true };
}
export class ProgressStore {
  constructor(
    storage,
    now = () => Date.now(),
    locks = globalThis.navigator?.locks,
  ) {
    this.storage = storage;
    this.now = now;
    this.locks = locks;
    this.listeners = new Set();
    this.pending = Promise.resolve();
    this.saveError = !storage;
    this.future = false;
    this.state = this.read();
  }
  read() {
    let raw,
      legacy = 0;
    try {
      legacy = JSON.parse(this.storage?.getItem("jelly-best") ?? "0");
    } catch {
      this.saveError = true;
    }
    try {
      raw = JSON.parse(this.storage?.getItem(SAVE_KEY) ?? "null");
    } catch {
      this.saveError = true;
    }
    this.future = Number(raw?.version) > SAVE_VERSION;
    const next = migrate(raw, legacy);
    return this.state && this.state.revision > next.revision
      ? this.state
      : next;
  }
  refresh() {
    this.state = this.read();
    this.notify({ ok: true, refresh: true });
    return this.state;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify(result) {
    for (const fn of this.listeners) fn(this.state, result);
  }
  dispatch(action) {
    const at = this.now();
    const work = () => {
      this.state = this.read();
      if (this.future)
        return {
          ok: false,
          message:
            "新しいバージョンのセーブデータです。アプリを更新してください。",
        };
      const next = structuredClone(this.state),
        result = apply(next, action, at);
      if (result.ok && !result.duplicate) {
        next.revision++;
        this.state = next;
        try {
          if (!this.storage) throw new Error("Storage unavailable");
          this.storage.setItem(SAVE_KEY, JSON.stringify(next));
          this.storage?.setItem("jelly-best", String(next.stats.best));
          this.saveError = false;
        } catch {
          this.saveError = true;
        }
      }
      this.notify(result);
      return result;
    };
    const execute = () =>
      this.locks?.request
        ? this.locks.request("jelly-tower-save", work)
        : work();
    const task = this.pending.then(execute, execute);
    this.pending = task.catch(() => {});
    return task;
  }
}
