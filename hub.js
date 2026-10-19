import { JELLIES, ACCESSORIES, BACKGROUNDS, ITEMS, BY_ID } from "./catalog.js";
import { missionState, japanDay } from "./progress.js";
import { jelly } from "./art.js";
import { scene } from "./backgrounds.js";
import "./hub.css";
const svg = (path) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  missions: svg(
    '<path d="M8 4h8v9a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v4a4 4 0 0 0 4 4m8-8h4v4a4 4 0 0 1-4 4m-4 3v4m-4 0h8"/>',
  ),
  shop: svg(
    '<path d="m4 8 2-5h12l2 5v3a3 3 0 0 1-4 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-4-2V8Z"/><path d="M5 14v7h14v-7M9 21v-5h6v5M4 8h16"/>',
  ),
  collection: svg(
    '<path d="M3 5c4-2 7-1 9 1 2-2 5-3 9-1v15c-4-2-7-1-9 1-2-2-5-3-9-1V5Zm9 1v15"/><path d="m6 9 2 1m-2 3 2 1m8-4 2-1m-2 5 2-1"/>',
  ),
  coin: svg(
    '<circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>',
  ),
  spark: svg('<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm8 0v4m-2-2h4"/>'),
  lock: svg(
    '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  ),
};
const yen = (n) => n.toLocaleString("ja-JP");
export function createHub(store, { pause, changed, sound }) {
  const nav = document.createElement("nav");
  nav.className = "hub-nav";
  nav.setAttribute("aria-label", "お楽しみメニュー");
  nav.innerHTML = ["missions", "shop", "collection"]
    .map(
      (id, i) =>
        `<button data-open="${id}" aria-haspopup="dialog">${icons[id]}<span>${["ミッション", "ショップ", "コレクション"][i]}</span>${id === "missions" ? '<b id="mission-badge" hidden></b>' : ""}</button>`,
    )
    .join("");
  document.querySelector("main").append(nav);
  const wallet = document.createElement("div");
  wallet.className = "wallet";
  wallet.innerHTML = `${icons.coin}<span id="points">0</span><small>P</small>`;
  wallet.setAttribute("aria-label", "所持スイーツポイント");
  document.querySelector(".page-heading").append(wallet);
  const dialog = document.createElement("dialog");
  dialog.id = "hub";
  dialog.setAttribute("aria-labelledby", "hub-title");
  dialog.innerHTML =
    '<div class="hub-head"><div><span class="eyebrow">SWEET LITTLE COLLECTION</span><h2 id="hub-title"></h2></div><button id="hub-close" aria-label="ゲームに戻る">×</button></div><div id="hub-body"></div>';
  document.body.append(dialog);
  const toast = document.createElement("div");
  toast.className = "reward-toast";
  toast.setAttribute("role", "status");
  toast.hidden = true;
  document.body.append(toast);
  let toastTimer;
  const warning = document.createElement("p");
  warning.className = "save-warning";
  warning.hidden = true;
  document.querySelector("main").append(warning);
  let view = "missions",
    tab = "first",
    detail = null,
    confirm = false,
    dress = null,
    busy = false,
    opener = null;
  let previousRoute = "";
  let awaitingClose = false;
  function placeToast() {
    (dialog.open ? dialog : document.body).append(toast);
    toast.classList.toggle("in-dialog", dialog.open);
  }
  function notify(message, reward = false) {
    placeToast();
    clearTimeout(toastTimer);
    toast.innerHTML = `${icons.spark}<span></span>`;
    toast.querySelector("span").textContent = message;
    toast.hidden = false;
    toast.classList.remove("celebrate");
    void toast.offsetWidth;
    toast.classList.add("celebrate");
    toastTimer = setTimeout(() => (toast.hidden = true), 3000);
    if (reward) sound("milestone");
  }
  function update() {
    const s = store.state;
    document.querySelector("#points").textContent = yen(s.points);
    wallet.title = `スイーツポイント ${yen(s.points)}P（ゲーム内専用・換金不可）`;
    const ready = ["first", "daily"]
      .flatMap((k) => missionState(s, k, store.now()))
      .filter((x) => x.complete && !x.claimed).length;
    const badge = document.querySelector("#mission-badge");
    badge.hidden = !ready;
    badge.textContent = ready;
    nav
      .querySelector('[data-open="missions"]')
      .setAttribute(
        "aria-label",
        ready ? `ミッション・受け取れる報酬${ready}件` : "ミッション",
      );
    warning.hidden = !store.saveError && !store.future;
    warning.textContent = store.future
      ? "新しいバージョンのデータです。アプリを更新してください。"
      : "保存できませんでした。この画面では続けられますが、閉じると進捗が失われる可能性があります。";
  }
  function open(which) {
    if (dialog.open) return;
    opener = document.activeElement;
    view = which;
    tab = which === "missions" ? "first" : "jelly";
    detail = null;
    dress = null;
    confirm = false;
    awaitingClose = true;
    pause(true);
    store.refresh();
    render();
    dialog.showModal();
    placeToast();
  }
  function close() {
    if (!dialog.open) return;
    dialog.close();
    resume();
  }
  function resume() {
    if (dialog.open || !awaitingClose) return;
    awaitingClose = false;
    placeToast();
    pause(false);
    opener?.focus();
  }
  dialog.addEventListener("close", resume);
  dialog.querySelector("#hub-close").onclick = close;
  nav.addEventListener("click", (e) => {
    const button = e.target.closest("[data-open]");
    if (button) open(button.dataset.open);
  });
  function tabs() {
    const options =
      view === "missions"
        ? [
            ["first", "初回限定"],
            ["daily", "デイリー"],
          ]
        : [
            ["jelly", "ゼリー"],
            ["accessory", "着せ替え"],
            ["background", "背景"],
          ];
    return `<div class="hub-tabs" role="tablist" aria-label="${view === "missions" ? "ミッション" : "アイテム"}の種類">${options.map(([id, name]) => `<button role="tab" id="tab-${id}" aria-selected="${tab === id}" aria-controls="hub-panel" data-tab="${id}">${name}</button>`).join("")}</div>`;
  }
  const preview = (id, large = false, acc) =>
    `<canvas class="item-art${large ? " large" : ""}" width="${large ? 640 : 320}" height="${large ? 380 : 210}" data-art="${id}"${acc !== undefined ? ` data-accessory="${acc}"` : ""} aria-label="${BY_ID[id]?.name ?? "ゼリー"}のプレビュー" role="img"></canvas>`;
  function missions() {
    const rows = missionState(store.state, tab, store.now());
    return `<p class="hub-intro">${tab === "daily" ? `${japanDay(store.now())} ・ 毎日 日本時間0:00に更新` : "小さな「できた！」を、スイーツポイントに。"}</p><div class="mission-list">${rows.map((m) => `<article class="mission-card ${m.complete ? "complete" : ""}"><div class="mission-symbol">${m.complete ? icons.spark : icons.missions}</div><div class="mission-copy"><h3>${m.name}</h3><div class="mission-progress"><progress max="${m.goal}" value="${m.value}" aria-label="${m.name}の進捗"></progress><small>${m.value} / ${m.goal}</small></div><span class="mission-reward">${m.reward}P ${m.complete ? "・クリア！" : ""}</span></div><button class="pill claim" data-claim="${m.id}" ${!m.complete || m.claimed ? "disabled" : ""}>${m.claimed ? "受取済み" : m.complete ? "受け取る" : "挑戦中"}</button></article>`).join("")}</div><p class="fine-print">ポイントはゲーム内専用です。現金には交換できません。</p>`;
  }
  function products() {
    return ITEMS.filter(
      (x) => x.type === tab && (view === "collection" || x.price > 0),
    );
  }
  function grid() {
    const s = store.state;
    return `<p class="hub-intro">${view === "shop" ? "がんばったごほうびに、とっておきを。" : `あつめたアイテム ${s.owned.length} / ${ITEMS.length} ・ 収集率 ${Math.round((s.owned.length / ITEMS.length) * 100)}%`}</p>${view === "collection" && tab === "accessory" ? '<button class="pill wardrobe-open" data-dress="pink">ゼリーを選んで着せ替える</button>' : ""}<div class="item-grid">${products()
      .map((item) => {
        const owned = s.owned.includes(item.id),
          on = s.enabled.includes(item.id),
          equipped = tab === "background" && s.background === item.id;
        return `<article class="item-card ${!owned && view === "collection" ? "locked" : ""}"><button class="art-button" data-detail="${item.id}" aria-label="${item.name}をプレビュー">${preview(item.id)}${!owned && view === "collection" ? `<span class="lock-mark">${icons.lock}</span>` : ""}</button><h3>${item.name}</h3>${view === "shop" ? `<button class="pill ${owned ? "quiet" : ""}" data-detail="${item.id}">${owned ? "購入済み" : `${yen(item.price)}P ・ 見てみる`}</button>` : !owned ? `<button class="pill quiet" data-detail="${item.id}">ショップで見る</button>` : tab === "jelly" ? `<button class="pill ${on ? "active" : "quiet"}" data-toggle="${item.id}" aria-label="${item.name}の登場" aria-pressed="${on}">登場 ${on ? "ON" : "OFF"}</button><button class="text-button" data-dress="${item.id}">着せ替え</button>` : tab === "background" ? `<button class="pill ${equipped ? "active" : ""}" data-background="${item.id}" ${equipped ? "disabled" : ""}>${equipped ? "✓ 使用中" : "この背景にする"}</button>` : `<button class="pill" data-wear="${item.id}">装備するゼリーを選ぶ</button>`}</article>`;
      })
      .join("")}</div>`;
  }
  function details() {
    const item = BY_ID[detail],
      s = store.state,
      owned = s.owned.includes(item.id),
      enough = s.points >= item.price;
    return `<button class="text-button back" data-back>← 一覧に戻る</button><section class="product-detail">${preview(item.id, true)}<span class="eyebrow">${item.type === "jelly" ? "JELLY" : item.type === "accessory" ? "DRESS UP" : "DREAMY WORLD"}</span><h3>${confirm ? "購入の確認" : item.name}</h3><p>${confirm ? `${item.name}を ${yen(item.price)}P で購入しますか？` : item.description}</p><strong class="price">${yen(item.price)}<small>P</small></strong>${confirm ? `<p>所持 ${yen(s.points)}P → 購入後 ${yen(Math.max(0, s.points - item.price))}P</p>` : ""}${owned ? `<p class="owned-note">✓ 購入済み・何度でも使えます</p><button class="pill big" data-use="${item.id}">コレクションで使う</button>` : `<button class="pill big" ${!enough ? "disabled" : ""} ${confirm ? `data-buy="${item.id}"` : "data-confirm"}>${!enough ? "ポイントが足りません" : confirm ? "購入を確定する" : `購入する ${yen(item.price)}P`}</button>${!enough ? '<button class="text-button" data-earn>ミッションでポイントを集める</button>' : ""}${confirm ? '<button class="text-button" data-cancel-buy>やめておく</button>' : ""}`}</section>`;
  }
  function wardrobe() {
    const s = store.state,
      j = BY_ID[dress];
    return `<button class="text-button back" data-back>← コレクションに戻る</button><section class="wardrobe-hero"><label for="dress-jelly">着せ替えるゼリー</label><select id="dress-jelly">${JELLIES.filter(
      (x) => s.owned.includes(x.id),
    )
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === dress ? "selected" : ""}>${x.name}</option>`,
      )
      .join(
        "",
      )}</select>${preview(dress, true, s.accessories[dress] ?? "")}<p>${j.name}のおしゃれ</p><button class="pill quiet" data-equip="">アクセサリーを外す</button></section><div class="item-grid accessory-grid">${ACCESSORIES.map(
      (a) => {
        const owned = s.owned.includes(a.id),
          on = s.accessories[dress] === a.id;
        return `<article class="item-card">${preview(dress, false, a.id)}<h3>${a.name}</h3><button class="pill ${on ? "active" : !owned ? "quiet" : ""}" ${owned ? `data-equip="${a.id}"` : `data-detail="${a.id}"`} ${on ? "disabled" : ""}>${on ? "✓ 装備中" : owned ? "これを装備" : "鍵・ショップへ"}</button></article>`;
      },
    ).join("")}</div>`;
  }
  function render() {
    if (!dialog) return;
    const focused = dialog.contains(document.activeElement)
      ? document.activeElement?.getAttribute("data-focus")
      : null;
    dialog.querySelector("#hub-title").textContent =
      view === "missions"
        ? "ミッション"
        : view === "shop"
          ? "スイーツショップ"
          : "ゼリーコレクション";
    dialog.querySelector("#hub-body").innerHTML =
      `<div class="hub-balance">${icons.coin}<strong>${yen(store.state.points)}P</strong><span>スイーツポイント</span></div>${!detail && !dress ? tabs() : ""}<div id="hub-panel" ${!detail && !dress ? `role="tabpanel" aria-labelledby="tab-${tab}"` : ""}>${detail ? details() : dress ? wardrobe() : view === "missions" ? missions() : grid()}</div>`;
    paint();
    const route = `${view}/${tab}/${detail ?? ""}/${dress ?? ""}`;
    if (route !== previousRoute) {
      dialog.querySelector("#hub-body").scrollTop = 0;
      previousRoute = route;
    }
    for (const [i, b] of [...dialog.querySelectorAll("button")].entries())
      b.dataset.focus = String(i);
    if (focused)
      dialog
        .querySelector(`[data-focus="${focused}"]`)
        ?.focus({ preventScroll: true });
  }
  function paint() {
    for (const canvas of dialog.querySelectorAll("[data-art]")) {
      const item = BY_ID[canvas.dataset.art],
        c = canvas.getContext("2d");
      c.clearRect(0, 0, canvas.width, canvas.height);
      if (item.type === "background") {
        c.drawImage(scene(item.id), 0, 0, canvas.width, canvas.height);
        continue;
      }
      const j = item.type === "jelly" ? item : BY_ID.pink,
        acc =
          canvas.dataset.accessory ??
          (item.type === "accessory"
            ? item.id
            : (store.state.accessories[j.id] ?? ""));
      const scale =
        canvas.width / (canvas.classList.contains("large") ? 155 : 135);
      c.save();
      c.translate(canvas.width / 2, canvas.height * 0.7);
      c.scale(scale, scale);
      jelly(c, 0, 0, 0, j.color, 0, 0, 0, null, acc);
      c.restore();
    }
  }
  async function action(a) {
    if (busy) return;
    busy = true;
    try {
      const r = await store.dispatch(a);
      if (!r.ok) notify(r.message);
      return r;
    } finally {
      busy = false;
    }
  }
  dialog.addEventListener("change", (e) => {
    if (e.target.id === "dress-jelly") {
      dress = e.target.value;
      render();
    }
  });
  dialog.addEventListener("keydown", (e) => {
    if (
      e.target.getAttribute("role") === "tab" &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
    ) {
      e.preventDefault();
      const all = [...dialog.querySelectorAll("[role=tab]")],
        i = all.indexOf(e.target),
        next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? all.length - 1
              : (i + (e.key === "ArrowRight" ? 1 : all.length - 1)) %
                all.length;
      all[next].click();
      dialog.querySelectorAll("[role=tab]")[next]?.focus();
    }
  });
  dialog.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled || busy) return;
    const d = b.dataset;
    if (d.tab) {
      tab = d.tab;
      detail = null;
      dress = null;
      render();
    } else if (d.claim) await action({ type: "claim", id: d.claim, kind: tab });
    else if (d.detail) {
      detail = d.detail;
      confirm = false;
      dress = null;
      render();
    } else if ("back" in d) {
      detail = null;
      dress = null;
      confirm = false;
      render();
    } else if ("confirm" in d) {
      confirm = true;
      render();
    } else if ("cancelBuy" in d) {
      confirm = false;
      render();
    } else if (d.buy) await action({ type: "buy", id: d.buy });
    else if (d.toggle) await action({ type: "toggle", id: d.toggle });
    else if (d.background)
      await action({ type: "background", id: d.background });
    else if (d.dress) {
      dress = d.dress;
      detail = null;
      render();
    } else if (d.wear) {
      dress = "pink";
      detail = null;
      render();
    } else if ("equip" in d)
      await action({ type: "dress", jelly: dress, id: d.equip });
    else if (d.use) {
      const item = BY_ID[d.use];
      view = "collection";
      tab = item.type;
      detail = null;
      if (item.type === "accessory") dress = "pink";
      else dress = null;
      render();
    } else if ("earn" in d) {
      view = "missions";
      tab = "first";
      detail = null;
      render();
    }
  });
  store.subscribe((s, r) => {
    update();
    changed(s);
    if (r.reward) notify(`+${r.reward}P 獲得！`, true);
    if (r.purchased) {
      notify(r.message);
      sound("record");
    }
    if (dialog.open) render();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "jelly-progress" || e.key === "jelly-best") store.refresh();
  });
  setInterval(() => {
    update();
    if (dialog.open && view === "missions") render();
  }, 15000);
  update();
  return { notify, open };
}
