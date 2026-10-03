import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [width, height] of [[1920, 1200], [1600, 1000], [1440, 1000], [1280, 900], [1024, 800], [900, 900], [700, 900], [390, 844], [360, 780]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  for (const section of [".workspace-grid", ".texture-studio", ".starter-templates"]) {
    await page.locator(section).first().scrollIntoViewIfNeeded();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${width}px horizontal overflow`).toBeLessThanOrEqual(0);
  const boxes = await page.evaluate(() => {
    const rect = selector => { const element = document.querySelector(selector); if (!element) return null; const box = element.getBoundingClientRect(); return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }; };
    return { prompt: rect(".prompt-panel"), preview: rect(".preview-panel"), texture: rect(".texture-studio"), give: rect(".give-panel"), canvas: rect(".three-container canvas") };
  });
  // Below 640px the workspace stacks into one column, so the panels share the x range by design.
  if (width <= 640) expect(boxes.prompt.y + boxes.prompt.h, `${width}px panels should stack`).toBeLessThanOrEqual(boxes.preview.y + 1);
  else expect(boxes.prompt.x + boxes.prompt.w, `${width}px prompt/preview overlap`).toBeLessThanOrEqual(boxes.preview.x + 1);
  expect(boxes.canvas.w).toBeGreaterThan(120);
  expect(boxes.canvas.h).toBeGreaterThan(120);
  expect(boxes.give.w).toBeGreaterThan(120);
  expect(boxes.texture.h).toBeGreaterThan(150);
  console.log(`${width}×${height} ok · prompt ${boxes.prompt.w}px · viewer ${boxes.canvas.w}×${boxes.canvas.h} · texture panel ${boxes.texture.h}px`);
  expect(errors).toEqual([]);
  await page.close();
}
await browser.close();
console.log("Responsive layout verified with no overflow or overlap");
