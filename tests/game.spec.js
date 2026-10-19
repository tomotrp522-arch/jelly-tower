import { test, expect } from "@playwright/test";
async function drop(page, x = 0.5) {
  await page.waitForFunction(() => document.querySelector("#game").width > 300);
  const c = page.locator("#game");
  const b = await c.boundingBox();
  await c.dispatchEvent("pointerdown", {
    pointerId: 1,
    isPrimary: true,
    clientX: b.x + b.width * x,
    clientY: b.y + 100,
    pointerType: "touch",
  });
  await c.dispatchEvent("pointerup", {
    pointerId: 1,
    isPrimary: true,
    clientX: b.x + b.width * x,
    clientY: b.y + 100,
    pointerType: "touch",
  });
}
test("touch stacking, falling, retry and persistent best", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator("#score")).toHaveText("0こ");
  await drop(page);
  await expect(page.locator("#score")).toHaveText("1こ");
  await page.waitForTimeout(850);
  await drop(page);
  await expect(page.locator("#score")).toHaveText("2こ");
  await page.waitForTimeout(850);
  await drop(page, 0.04);
  await expect(page.locator("#gameover")).toBeVisible({ timeout: 10000 });
  await page.screenshot({
    path: `test-results/${test.info().project.name}/gameover.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "もういちど遊ぶ" }).click();
  await expect(page.locator("#score")).toHaveText("0こ");
  await expect(page.locator("#best")).toHaveText("2こ");
  await page.reload();
  await expect(page.locator("#best")).toHaveText("2こ");
  expect(errors).toEqual([]);
});
test("sound persists and keyboard works on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./");
  await page.getByRole("button", { name: "効果音をオフにする" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "効果音をオンにする" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.locator("#game").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("1こ");
  await page.screenshot({
    path: `test-results/${test.info().project.name}/desktop.png`,
    fullPage: true,
  });
});
test("subdirectory PWA shell works offline", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await page.evaluate(
    async () => await (await fetch("./manifest.webmanifest")).json(),
  );
  expect(manifest.start_url).toBe("./");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toContainText("ゼリータワー");
  await drop(page);
  await expect(page.locator("#score")).toHaveText("1こ");
  await page.screenshot({
    path: `test-results/${test.info().project.name}/mobile.png`,
    fullPage: true,
  });
});
test("tower remains playable as camera follows eight jellies", async ({
  page,
}) => {
  await page.goto("./");
  for (let n = 1; n <= 8; n++) {
    await drop(page);
    await expect(page.locator("#score")).toHaveText(`${n}こ`);
    await page.waitForTimeout(850);
  }
  await expect(page.locator("#gameover")).toBeHidden();
  await page.screenshot({
    path: `test-results/${test.info().project.name}/tower.png`,
    fullPage: true,
  });
});

test("redesigned controls fit small phones, tablets and desktop", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [768, 1024],
    [1280, 900],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const shell = document
        .querySelector(".game-shell")
        .getBoundingClientRect();
      const sound = document.querySelector("#sound").getBoundingClientRect();
      const score = document.querySelector(".scorebar").getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        soundFits: sound.right <= shell.right && sound.left >= shell.left,
        scoreFits: score.right < shell.right,
        buttonWidth: sound.width,
        buttonHeight: sound.height,
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.soundFits).toBe(true);
    expect(layout.scoreFits).toBe(true);
    expect(layout.buttonWidth).toBeGreaterThanOrEqual(44);
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "遊びかた" }).click();
  await expect(page.locator("#instructions")).toBeVisible();
  await expect(page.locator("#score")).toHaveText("0こ");
  await page.getByRole("button", { name: "遊びかた" }).click();
  await expect(page.locator("#instructions")).toBeHidden();
  await page.screenshot({
    path: `test-results/${test.info().project.name}/redesign-start.png`,
    fullPage: true,
  });
});
