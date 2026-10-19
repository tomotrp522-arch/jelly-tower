import { test, expect } from "@playwright/test";
const saved = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("jelly-progress")));
async function open(page, name) {
  if (await page.locator("#hub").isVisible())
    await page
      .getByRole("button", { name: "ゲームに戻る", exact: true })
      .click();
  await page
    .getByRole("button", {
      name,
      exact: name === "ショップ" || name === "コレクション",
    })
    .click();
  await expect(page.locator("#hub")).toBeVisible();
}
async function product(page, name, tab) {
  await open(page, "ショップ");
  if (tab) await page.getByRole("tab", { name: tab, exact: true }).click();
  await page
    .getByRole("button", { name: `${name}をプレビュー`, exact: true })
    .click();
  await page.getByRole("button", { name: /購入する / }).click();
}
const card = (page, name) =>
  page
    .locator(".item-card")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });

test("earn, purchase once, equip per jelly, select background and retain everything offline", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("test-migrated")) {
      localStorage.setItem("jelly-best", "20");
      localStorage.setItem("test-migrated", "yes");
    }
  });
  await page.goto("./");
  await expect(page.locator("#best")).toHaveText("20こ");
  await expect(page.locator("#points")).toHaveText("0");
  await open(page, /^ミッション/);
  const first = page
    .locator(".mission-card")
    .filter({ hasText: "ゼリーを初めて3個積む" })
    .getByRole("button", { name: "受け取る" });
  await first.evaluate((b) => {
    b.click();
    b.click();
  });
  await expect(page.locator("#points")).toHaveText("30");
  await expect(page.locator("#hub .reward-toast")).toContainText("+30P");
  await page.screenshot({
    path: `test-results/${test.info().project.name}/reward.png`,
    fullPage: true,
  });
  for (const n of [5, 10, 15, 20])
    await page
      .locator(".mission-card")
      .filter({ hasText: `1回のプレイで${n}個積む` })
      .getByRole("button", { name: "受け取る" })
      .click();
  await expect(page.locator("#points")).toHaveText("780");
  await page.screenshot({
    path: `test-results/${test.info().project.name}/missions.png`,
    fullPage: true,
  });
  await product(page, "いちごゼリー");
  await page.getByRole("button", { name: "やめておく" }).click();
  expect((await saved(page)).points).toBe(780);
  await page.getByRole("button", { name: /購入する / }).click();
  await page.getByRole("button", { name: "購入を確定する" }).evaluate((b) => {
    b.click();
    b.click();
  });
  await expect(page.locator("#points")).toHaveText("680");
  await expect(page.getByText("✓ 購入済み・何度でも使えます")).toBeVisible();
  await product(page, "ピンクのリボン", "着せ替え");
  await page.getByRole("button", { name: "購入を確定する" }).click();
  await expect(page.locator("#points")).toHaveText("530");
  await product(page, "お菓子の国", "背景");
  await page.getByRole("button", { name: "購入を確定する" }).click();
  await expect(page.locator("#points")).toHaveText("230");
  await open(page, "コレクション");
  await card(page, "いちごゼリー")
    .getByRole("button", { name: "着せ替え", exact: true })
    .click();
  const before = await page
    .locator(".wardrobe-hero canvas")
    .evaluate((c) => c.toDataURL());
  await page.getByRole("button", { name: "これを装備", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "✓ 装備中", exact: true }),
  ).toBeVisible();
  const after = await page
    .locator(".wardrobe-hero canvas")
    .evaluate((c) => c.toDataURL());
  expect(after).not.toBe(before);
  await page.locator("#dress-jelly").selectOption("blue");
  await expect(
    page.getByRole("button", { name: "✓ 装備中", exact: true }),
  ).toHaveCount(0);
  await page.locator("#dress-jelly").selectOption("strawberry");
  await expect(
    page.getByRole("button", { name: "✓ 装備中", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${test.info().project.name}/wardrobe.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "← コレクションに戻る" }).click();
  await page
    .getByRole("button", { name: "いちごゼリーの登場", exact: true })
    .click();
  for (const name of [
    "ピンク",
    "むらさき",
    "水色",
    "きいろ",
    "ミント",
    "オレンジ",
  ])
    await page
      .getByRole("button", { name: `${name}の登場`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "いちごゼリーの登場", exact: true })
    .click();
  expect((await saved(page)).enabled).toEqual(["strawberry"]);
  await page.getByRole("tab", { name: "背景", exact: true }).click();
  await card(page, "お菓子の国")
    .getByRole("button", { name: "この背景にする" })
    .click();
  await expect(
    card(page, "お菓子の国").getByRole("button", { name: "✓ 使用中" }),
  ).toBeVisible();
  await open(page, /^ミッション/);
  for (const name of [
    "初めてショップで購入する",
    "初めて着せ替えする",
    "初めて背景を変更する",
  ])
    await page
      .locator(".mission-card")
      .filter({ hasText: name })
      .getByRole("button", { name: "受け取る" })
      .click();
  await expect(page.locator("#points")).toHaveText("430");
  await page.getByRole("button", { name: "ゲームに戻る", exact: true }).click();
  await page.locator("#game").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("1こ");
  let s = await saved(page);
  expect(s.stats.purchases).toBe(3);
  expect(s.stats.plays).toBe(1);
  expect(s.accessories.strawberry).toBe("pink-bow");
  expect(s.background).toBe("candy");
  expect(s.earned).toBe(980);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#points")).toHaveText("430");
  await expect(page.locator("#best")).toHaveText("20こ");
  await open(page, "コレクション");
  await expect(
    page.getByRole("button", { name: "いちごゼリーの登場", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "ゲームに戻る", exact: true }).click();
  await page.locator("#game").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("1こ");
  s = await saved(page);
  expect(s.stats.stacks).toBe(2);
  expect(errors).toEqual([]);
});

test("real stacking progresses missions once and opening a screen safely pauses falling", async ({
  page,
}) => {
  await page.goto("./");
  for (let n = 1; n <= 3; n++) {
    await expect(page.locator("#game")).toHaveAttribute("aria-busy", "false");
    await page.locator("#game").focus();
    await page.keyboard.press("Space");
    if (n === 1) {
      await open(page, /^ミッション/);
      await page.waitForTimeout(1200);
      await expect(page.locator("#score")).toHaveText("0こ");
      await page
        .getByRole("button", { name: "ゲームに戻る", exact: true })
        .click();
    }
    await expect(page.locator("#score")).toHaveText(`${n}こ`);
    await page.waitForTimeout(850);
  }
  await expect(page.locator("#mission-badge")).toBeVisible();
  await open(page, /^ミッション/);
  await page
    .locator(".mission-card")
    .filter({ hasText: "ゼリーを初めて3個積む" })
    .getByRole("button", { name: "受け取る" })
    .click();
  await expect(page.locator("#points")).toHaveText("30");
  await page.getByRole("tab", { name: "デイリー" }).click();
  await expect(
    page
      .locator(".mission-card")
      .filter({ hasText: "今日ゼリーを合計10個積む" }),
  ).toContainText("3 / 10");
  await open(page, "ショップ");
  await page.getByRole("button", { name: "いちごゼリーをプレビュー" }).click();
  await expect(
    page.getByRole("button", { name: "ポイントが足りません" }),
  ).toBeDisabled();
  expect((await saved(page)).stats.stacks).toBe(3);
  expect((await saved(page)).stats.plays).toBe(1);
});

test("daily UI rolls over at Japan midnight without reusing yesterday claims", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-19T14:59:00Z") });
  await page.addInitScript(() => {
    localStorage.setItem(
      "jelly-progress",
      JSON.stringify({
        version: 1,
        points: 30,
        earned: 30,
        daily: {
          "2026-10-19": {
            stacks: 30,
            plays: 3,
            best: 10,
            claimed: ["daily-10"],
          },
        },
      }),
    );
  });
  await page.goto("./");
  await open(page, /^ミッション/);
  await page.getByRole("tab", { name: "デイリー", exact: true }).click();
  await expect(page.locator(".hub-intro")).toContainText("2026-10-19");
  await expect(
    page
      .locator(".mission-card")
      .filter({ hasText: "今日ゼリーを合計10個積む" }),
  ).toContainText("受取済み");
  await page.clock.fastForward(61_000);
  await page.getByRole("tab", { name: "初回限定" }).click();
  await page.getByRole("tab", { name: "デイリー", exact: true }).click();
  await expect(page.locator(".hub-intro")).toContainText("2026-10-20");
  await expect(
    page
      .locator(".mission-card")
      .filter({ hasText: "今日ゼリーを合計10個積む" }),
  ).toContainText("0 / 10");
  await expect(
    page.getByRole("button", { name: "受け取る", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#points")).toHaveText("30");
});

test("multiple tabs cannot buy the same item twice", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("jelly-progress"))
      localStorage.setItem("jelly-best", "20");
  });
  await page.goto("./");
  await open(page, /^ミッション/);
  await page
    .locator(".mission-card")
    .filter({ hasText: "1回のプレイで20個積む" })
    .getByRole("button", { name: "受け取る" })
    .click();
  await expect(page.locator("#points")).toHaveText("400");
  const other = await context.newPage();
  await other.goto("./");
  await product(page, "いちごゼリー");
  await product(other, "いちごゼリー");
  await Promise.all([
    page.evaluate(() => document.querySelector("[data-buy]")?.click()),
    other.evaluate(() => document.querySelector("[data-buy]")?.click()),
  ]);
  await expect(page.locator("#points")).toHaveText("300");
  await expect(other.locator("#points")).toHaveText("300");
  expect((await saved(page)).stats.purchases).toBe(1);
  await other.close();
});

test("all catalog art is distinct and hub layouts fit narrow screens", async ({
  page,
}) => {
  await page.goto("./");
  await open(page, "ショップ");
  await expect(page.locator(".item-card")).toHaveCount(7);
  let art = await page
    .locator(".item-art")
    .evaluateAll((all) => all.map((c) => c.toDataURL()));
  expect(new Set(art).size).toBe(7);
  await page.getByRole("tab", { name: "着せ替え", exact: true }).click();
  await expect(page.locator(".item-card")).toHaveCount(10);
  art = await page
    .locator(".item-art")
    .evaluateAll((all) => all.map((c) => c.toDataURL()));
  expect(new Set(art).size).toBe(10);
  await page.getByRole("tab", { name: "背景", exact: true }).click();
  await expect(page.locator(".item-card")).toHaveCount(7);
  art = await page
    .locator(".item-art")
    .evaluateAll((all) => all.map((c) => c.toDataURL()));
  expect(new Set(art).size).toBe(7);
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [1280, 900],
  ]) {
    await page.setViewportSize({ width, height });
    const fits = await page.locator("#hub").evaluate((d) => {
      const body = d.querySelector("#hub-body");
      return {
        left: d.getBoundingClientRect().left,
        right: d.getBoundingClientRect().right,
        overflow: body.scrollWidth > body.clientWidth + 1,
      };
    });
    expect(fits.left).toBeGreaterThanOrEqual(0);
    expect(fits.right).toBeLessThanOrEqual(width);
    expect(fits.overflow).toBe(false);
  }
  await page.screenshot({
    path: `test-results/${test.info().project.name}/background-shop.png`,
    fullPage: true,
  });
});

test("storage write failure warns but does not stop the game or mission progress", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage full");
    };
  });
  await page.goto("./");
  for (let n = 1; n <= 3; n++) {
    await expect(page.locator("#game")).toHaveAttribute("aria-busy", "false");
    await page.locator("#game").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#score")).toHaveText(`${n}こ`);
    await page.waitForTimeout(850);
  }
  await expect(page.locator(".save-warning")).toBeVisible();
  await open(page, /^ミッション/);
  await page
    .locator(".mission-card")
    .filter({ hasText: "ゼリーを初めて3個積む" })
    .getByRole("button", { name: "受け取る" })
    .click();
  await expect(page.locator("#points")).toHaveText("30");
  await page.getByRole("button", { name: "ゲームに戻る", exact: true }).click();
  await page.locator("#game").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("4こ");
});
