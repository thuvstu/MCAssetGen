import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

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
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
const ids = new Set(),
  pending = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (response) => {
  if (response.url().endsWith("/api/models") && response.status() === 201)
    pending.push(
      response
        .json()
        .then((data) => {
          if (data.project) ids.add(data.project.id);
        })
        .catch(() => {}),
    );
});
async function preview(action) {
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/models") &&
      r.request().method() === "POST" &&
      r.status() < 300,
  );
  await action();
  const data = await (await response).json();
  await page.waitForSelector(".generation-overlay", { state: "detached" });
  await page.waitForTimeout(120);
  return data;
}
async function choose(kind) {
  await page.getByRole("tab", { name: "生成", exact: true }).click();
  return preview(() => page.locator("#model-type").selectOption(kind));
}
try {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForSelector(".viewport-renderer canvas");
  await page.waitForTimeout(500);
  const batches = Number(
    await page.locator(".viewport-renderer").getAttribute("data-model-batches"),
  );
  const count = Number(
    (await page.locator(".geometry-stats span").first().innerText()).match(
      /\d+/,
    )[0],
  );
  assert.ok(batches <= 4 && count > 200, `${count} cubes / ${batches} batches`);
  console.log(
    "Batched renderer:",
    count,
    "cubes ->",
    batches,
    "model draw batches",
  );
  await page.getByLabel("テンプレートを検索").fill("レールガン");
  assert.equal(await page.locator(".template-card").count(), 1);
  await preview(() =>
    page.getByRole("button", { name: "レールガン", exact: true }).click(),
  );
  await page.getByLabel("テンプレートを検索").fill("");
  console.log("Catalog search and railgun selection passed");

  for (const kind of [
    "grimoire",
    "magiccircle",
    "bow",
    "chainsaw",
    "spear",
    "mace",
    "bloodblade",
    "elderstaff",
    "rifle",
  ]) {
    const { model } = await choose(kind);
    assert.ok(model.cubes.length > 20);
    assert.equal(model.settings.kind, kind);
    if (kind === "grimoire" || kind === "spear" || kind === "rifle") {
      await page.waitForTimeout(200);
      await page.screenshot({ path: `artifacts/workshop-${kind}.png` });
    }
  }
  console.log("All requested weapon families rendered without errors");
  await page
    .getByRole("button", { name: "リロード", exact: true })
    .first()
    .click();
  await page.waitForFunction(
    () => document.querySelector(".action-name")?.textContent === "リロード",
  );
  await page.getByRole("button", { name: "モーションを一時停止" }).click();
  await page.getByLabel("モーションの時間").fill("0.5");
  assert.equal(await page.locator(".action-time").innerText(), "1.10s");
  console.log("Articulated reload motion can pause and scrub");

  await choose("sword");
  await page.getByRole("tab", { name: "仕上げ", exact: true }).click();
  await page.getByRole("button", { name: "オーロラ", exact: true }).click();
  await page.getByLabel("グラデーションの段階数").selectOption("4");
  const gradient = await preview(() =>
    page.getByRole("button", { name: "仕上げをプレビュー" }).click(),
  );
  assert.equal(gradient.model.settings.gradient.steps, 4);
  assert.ok(gradient.model.texture.name.includes("finished"));
  const decorated = await preview(() =>
    page
      .locator(".attachment-catalog")
      .getByRole("button", { name: "光輪", exact: true })
      .click(),
  );
  assert.equal(decorated.model.settings.attachments.length, 1);
  assert.ok(
    decorated.model.cubes.some((c) => c.name.startsWith("attachment_")),
  );
  await page.screenshot({ path: "artifacts/workshop-finish.png" });
  console.log("Quantised gradient baked into PNG; halo geometry added");

  await page.getByRole("tab", { name: "パーツ編集", exact: true }).click();
  const before = Number(
    (await page.locator(".geometry-stats span").first().innerText()).match(
      /\d+/,
    )[0],
  );
  await page.getByRole("button", { name: "キューブを追加" }).click();
  await page.getByLabel("選択パーツの名前").fill("Workshop test cube");
  await page.getByLabel("選択パーツのX位置").fill("4");
  await page.getByLabel("選択パーツのYサイズ").fill("3");
  await page.getByLabel("選択パーツの色").fill("#ef5678");
  await page.getByRole("switch", { name: "選択パーツを発光させる" }).click();
  await page.getByRole("button", { name: "複製", exact: true }).click();
  const duplicated = Number(
    (await page.locator(".geometry-stats span").first().innerText()).match(
      /\d+/,
    )[0],
  );
  assert.equal(duplicated, before + 2);
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  assert.equal(
    Number(
      (await page.locator(".geometry-stats span").first().innerText()).match(
        /\d+/,
      )[0],
    ),
    before + 1,
  );
  await page.getByRole("button", { name: "やり直し", exact: true }).click();
  assert.equal(
    Number(
      (await page.locator(".geometry-stats span").first().innerText()).match(
        /\d+/,
      )[0],
    ),
    before + 2,
  );
  await page.getByLabel("パーツを検索").fill("Workshop test cube");
  await page.locator(".outliner-pick").first().click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: "artifacts/workshop-editor.png" });
  const saved = await preview(() =>
    page.getByRole("button", { name: "モデルを生成", exact: true }).click(),
  );
  assert.equal(saved.project.settings.customCubes.length, 2);
  assert.ok(saved.project.settings.edits.some((e) => e.color === "#ef5678"));
  console.log(
    "Edit position, size, paint, emission, duplicate, undo and redo passed",
  );

  await page.getByRole("button", { name: "エクスポート", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ダウンロード", exact: true }).click();
  const file = await download;
  await file.saveAs("artifacts/workshop-edited.bbmodel");
  const bb = JSON.parse(
    await readFile("artifacts/workshop-edited.bbmodel", "utf8"),
  );
  assert.ok(bb.elements.some((e) => e.name === "Workshop test cube"));
  assert.equal(bb.resolution.width, saved.model.texture.width);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelector(".save-indicator")?.textContent === "保存済み",
  );
  await page.getByRole("tab", { name: "パーツ編集", exact: true }).click();
  await page.getByLabel("パーツを検索").fill("Workshop test cube");
  assert.equal(await page.locator(".outliner-pick").count(), 2);
  console.log("Edited project survived export and reload");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await mobile.getByRole("tab", { name: "仕上げ", exact: true }).click();
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
    0,
  );
  await mobile.screenshot({
    path: "artifacts/workshop-mobile.png",
    fullPage: true,
  });
  await mobile.getByRole("tab", { name: "パーツ編集", exact: true }).click();
  await mobile.getByRole("button", { name: "キューブを追加" }).click();
  assert.equal(await mobile.getByLabel("選択パーツの名前").count(), 1);
  console.log("Mobile finishing and parts editing passed");
  assert.deepEqual(errors, []);
  console.log("All workshop browser checks passed.");
} finally {
  await Promise.all(pending);
  for (const id of ids)
    await page.request.delete(`http://localhost:3000/api/models/${id}`);
  console.log("Removed only workshop test projects:", ids.size);
  await browser.close();
}
