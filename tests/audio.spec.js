import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { observeAudio, readRms } from "./audio-probe.js";

test("gesture starts audible music; mute, effects, game-over fade and retry work", async ({
  page,
}) => {
  await observeAudio(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  expect(await page.evaluate(() => window.__audio.length)).toBe(0);
  await page.getByRole("button", { name: "遊びかた" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__audio[0]?.state))
    .toBe("running");
  await page.waitForTimeout(300);
  expect(await readRms(page)).toBeGreaterThan(0.00001);
  await page.getByRole("button", { name: "遊びかた" }).click();
  await page.getByRole("button", { name: "音楽と効果音をオフにする" }).click();
  await page.waitForTimeout(350);
  expect(await readRms(page)).toBeLessThan(0.00001);
  const mutedCount = await page.evaluate(() => window.__audio[0].events.length);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__audio[0].events.length)).toBe(
    mutedCount,
  );
  // Muting never pauses physics.
  await page.locator("#game").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("1こ");
  await page.getByRole("button", { name: "音楽と効果音をオンにする" }).click();
  await page.waitForTimeout(300);
  expect(await readRms(page)).toBeGreaterThan(0.00001);
  await page.waitForTimeout(650);
  const before = await page.evaluate(
    () => window.__audio[0].events.filter((e) => e.channel === "effect").length,
  );
  await page.locator("#game").focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Space");
  await expect(page.locator("#gameover")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1500);
  expect(
    await page.evaluate(
      () =>
        window.__audio[0].events.filter((e) => e.channel === "effect").length,
    ),
  ).toBeGreaterThan(before);
  expect(
    await page.evaluate(() => window.__audio[0].gains[1].gain.value),
  ).toBeLessThan(0.06);
  await page.getByRole("button", { name: "もういちど遊ぶ" }).click();
  await page.waitForTimeout(700);
  expect(
    await page.evaluate(() => window.__audio[0].gains[1].gain.value),
  ).toBeGreaterThan(0.2);
  expect(await page.evaluate(() => window.__audio.length)).toBe(1);
  expect(errors).toEqual([]);
});

test("two full music loops render without silence at the seam or clipping", async ({
  page,
}) => {
  await page.goto("./");
  const source = readFileSync(new URL("../audio.js", import.meta.url), "utf8");
  const result = await page.evaluate(async (source) => {
    const { tone, musicStep, LOOP_STEPS, LOOP_SECONDS, STEP } = await import(
      "data:text/javascript;base64," + btoa(source)
    );
    const rate = 22050,
      context = new OfflineAudioContext(
        1,
        Math.ceil((LOOP_SECONDS * 2 + 0.8) * rate),
        rate,
      ),
      volume = context.createGain();
    volume.gain.value = 0.22;
    volume.connect(context.destination);
    for (let i = 0; i < LOOP_STEPS * 2; i++)
      for (const note of musicStep(i)) tone(context, volume, note, i * STEP);
    const buffer = await context.startRendering(),
      data = buffer.getChannelData(0);
    let peak = 0,
      jump = 0;
    for (let i = 1; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]));
      jump = Math.max(jump, Math.abs(data[i] - data[i - 1]));
    }
    const rms = (start, seconds) => {
      let sum = 0;
      const n = Math.floor(seconds * rate),
        offset = Math.floor(start * rate);
      for (let i = 0; i < n; i++) sum += data[offset + i] ** 2;
      return Math.sqrt(sum / n);
    };
    return {
      peak,
      jump,
      seam: rms(LOOP_SECONDS - 0.1, 0.2),
      sections: Array.from({ length: Math.floor(LOOP_SECONDS * 2) }, (_, i) =>
        rms(i, 1),
      ),
    };
  }, source);
  expect(result.peak).toBeGreaterThan(0.001);
  expect(result.peak).toBeLessThan(0.5);
  expect(result.jump).toBeLessThan(0.1);
  expect(result.seam).toBeGreaterThan(0.00001);
  expect(Math.min(...result.sections)).toBeGreaterThan(0.00001);
});
