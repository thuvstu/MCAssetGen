import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const errors = [];
const createdIds = new Set();
const captures = [];
page.on("response", (response) => {
  if (response.url().endsWith("/api/models") && response.status() === 201)
    captures.push(
      response
        .json()
        .then((data) => {
          if (data.project) createdIds.add(data.project.id);
        })
        .catch(() => {}),
    );
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") console.log("BROWSER:", message.text());
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForSelector(".viewport-renderer canvas");
await page.waitForTimeout(1300);
await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
console.log(
  "Desktop screenshot saved. Canvas:",
  await page.locator(".viewport-renderer canvas").count(),
);
console.log(
  "Initial layout:",
  await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    rightOverflow:
      document.querySelector(".settings-scroll").scrollHeight -
      document.querySelector(".settings-scroll").clientHeight,
    sideOverflow:
      document.querySelector(".sidebar-main").scrollHeight -
      document.querySelector(".sidebar-main").clientHeight,
  })),
);
await page.getByRole("button", { name: "UVエディタ", exact: true }).click();
await page.waitForSelector(".uv-large-texture");
await page.screenshot({ path: "artifacts/uv-editor.png" });
await page.getByRole("button", { name: "3Dプレビュー", exact: true }).click();
await page
  .getByRole("button", { name: "ワイヤーフレーム", exact: true })
  .click();
await page
  .getByRole("button", { name: "ワイヤーフレーム", exact: true })
  .click();
await page.getByRole("button", { name: "モデルを生成", exact: true }).click();
await page.waitForFunction(
  () => document.querySelector(".save-indicator")?.textContent === "保存済み",
);
const projectsResponse = await page.request.get(
  "http://localhost:3000/api/models",
);
const projects = (await projectsResponse.json()).projects;
if (!projects.length) throw new Error("Generation was not persisted");
const generatedId = projects[0].id;
console.log(
  "Generation saved:",
  generatedId,
  "cubes:",
  projects[0].model.cubes.length,
);
await page.getByRole("button", { name: "エクスポート", exact: true }).click();
await page.screenshot({ path: "artifacts/export.png" });
const downloadEvent = page.waitForEvent("download");
await page.getByRole("button", { name: "ダウンロード", exact: true }).click();
const download = await downloadEvent;
await download.saveAs("artifacts/test-model.bbmodel");
console.log("Blockbench download:", download.suggestedFilename());
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(
  () => document.querySelector(".save-indicator")?.textContent === "保存済み",
);
console.log("Persistent project restored after refresh");
const { PNG } = await import("pngjs");
const image = new PNG({ width: 32, height: 32 });
for (let i = 0; i < image.data.length; i += 4) {
  image.data[i] = 125;
  image.data[i + 1] = 85;
  image.data[i + 2] = 175;
  image.data[i + 3] = 255;
}
await page
  .getByLabel("UVアトラスをアップロード")
  .setInputFiles({
    name: "test_atlas.png",
    mimeType: "image/png",
    buffer: PNG.sync.write(image),
  });
await page.waitForFunction(
  () =>
    document.querySelector(".texture-file-info strong")?.textContent ===
    "test_atlas.png",
);
console.log("Custom UV atlas uploaded and applied in browser");
await page.getByRole("button", { name: "杖", exact: true }).click();
await page.waitForFunction(
  () =>
    document.querySelector("#model-type")?.value === "staff" &&
    !document.querySelector(".generation-overlay"),
);
await page.getByRole("button", { name: "軌道", exact: true }).click();
await page.getByRole("button", { name: "マジック", exact: true }).click();
await page.getByRole("button", { name: "回転", exact: true }).click();
await page.getByRole("button", { name: "モデルを生成", exact: true }).click();
await page.waitForFunction(
  () => document.querySelector(".save-indicator")?.textContent === "保存済み",
);
await page.waitForTimeout(900);
await page.screenshot({ path: "artifacts/staff-effects.png" });
console.log(
  "Staff template with orbit floaters, magic effect, and spin animation generated",
);

// Skill preset → sets floaters/effect/motion and previews it.
await page.getByRole("button", { name: "メテオ召喚" }).click();
await page.waitForSelector(".action-player");
await page.waitForFunction(
  () => !document.querySelector(".generation-overlay"),
);
console.log(
  "Skill preset applied; motion timeline visible:",
  await page.locator(".action-name").textContent(),
);
await page.getByRole("button", { name: "モーションを一時停止" }).click();
await page.getByLabel("モーションの時間").fill("0.4");
console.log(
  "Timeline paused and scrubbed:",
  await page.locator(".action-time").textContent(),
);

// Upgrade controls.
await page.getByRole("button", { name: "+4", exact: true }).click();
await page.getByRole("switch", { name: "限界突破を有効化" }).click();
await page.getByRole("button", { name: "解放", exact: true }).click();
await page.getByRole("button", { name: "モデルを生成", exact: true }).click();
await page.waitForFunction(
  () => document.querySelector(".save-indicator")?.textContent === "保存済み",
);
const badges = await page.locator(".variant-badge").allTextContents();
console.log("Upgraded model badges:", badges.join(", "));
if (
  !badges.includes("+4") ||
  !badges.includes("限界突破") ||
  !badges.includes("解放")
)
  throw new Error("Upgrade badges missing");
await page.waitForTimeout(700);
await page.screenshot({ path: "artifacts/upgraded.png" });

// Temporary mode for 4 seconds.
await page.getByRole("button", { name: "一時モード発動" }).click();
await page.waitForSelector(".mode-badge");
console.log("Temporary overdrive active");
await page.screenshot({ path: "artifacts/temporary-mode.png" });
await page.waitForSelector(".mode-badge", { state: "detached", timeout: 8000 });
console.log("Temporary mode reverted automatically");

// Variant browser.
await page.getByRole("button", { name: "バリアント", exact: true }).click();
await page.waitForFunction(
  () => document.querySelectorAll(".variant-card").length === 6,
);
console.log(
  "Tier family cards:",
  await page.locator(".variant-card .variant-label").allTextContents(),
);
await page.screenshot({ path: "artifacts/variants.png" });
await page.getByRole("tab", { name: "同テーマ" }).click();
await page.waitForFunction(
  () =>
    document.querySelectorAll(".variant-card").length === 24 &&
    document.querySelector(".variant-card .variant-label")?.textContent ===
      "剣",
);
console.log(
  "Theme family covers every template:",
  await page.locator(".variant-card .variant-label").allTextContents(),
);

const variantDownload = page.waitForEvent("download");
await page.getByRole("button", { name: "一式をZIPで書き出し" }).click();
console.log(
  "Variant pack download:",
  (await variantDownload).suggestedFilename(),
);
await page.locator(".variant-card", { hasText: "斧" }).click();
await page.waitForFunction(
  () =>
    document.querySelector("#model-type")?.value === "axe" &&
    !document.querySelector(".generation-overlay"),
);
console.log("Theme variant loaded into editor: axe");

// Mechanical template with a transformation motion.
await page.getByRole("button", { name: "機刃", exact: true }).click();
await page.waitForFunction(
  () =>
    document.querySelector("#model-type")?.value === "mechblade" &&
    !document.querySelector(".generation-overlay"),
);
await page.waitForSelector(".action-player");
console.log(
  "Mecha blade template with motion:",
  await page.locator(".action-name").textContent(),
);
await page.waitForTimeout(900);
await page.screenshot({ path: "artifacts/mechblade.png" });
await page
  .getByRole("button", { name: "マイモデル", exact: false })
  .first()
  .click();
await page.waitForSelector(".library-card");
await page.getByRole("button", { name: "閉じる", exact: true }).click();
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
mobile.on("pageerror", (error) => errors.push(error.message));
await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: "artifacts/mobile.png", fullPage: true });
console.log(
  "Mobile overflow:",
  await mobile.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  ),
);
await mobile.getByRole("button", { name: "サイドバーを開く" }).click();
await mobile.getByRole("button", { name: "斧", exact: true }).click();
await mobile.waitForFunction(
  () => document.querySelector("#model-type")?.value === "axe",
);
await mobile.waitForFunction(
  () => !document.querySelector(".generation-overlay"),
);
console.log("Mobile template switched");
await Promise.all(captures);
for (const id of createdIds)
  await page.request.delete(`http://localhost:3000/api/models/${id}`);
console.log("Cleaned up only this test’s projects:", createdIds.size);
await browser.close();
console.log("Page errors:", JSON.stringify(errors));
if (errors.length) process.exit(1);
console.log("All browser checks passed.");
