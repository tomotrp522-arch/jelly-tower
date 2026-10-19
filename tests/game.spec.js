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
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
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
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
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
  await page.screenshot({ path: "test-results/tower.png", fullPage: true });
});
