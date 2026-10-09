import { afterAll, describe, expect, it } from "vitest";
import { DELETE as deleteAssetRoute } from "@/app/api/assets/[id]/route";
import { POST as runRoute } from "@/app/api/studio/run/route";

/**
 * MOD まで一気通貫。
 *
 * テクスチャスタジオの出力をアセットバスへ保存し、**MOD エンジンがそれを
 * 取り込んで MOD 一式を生成する**ところまでをルートハンドラ経由で検証する。
 * (mythic = MythicForge / Fabric、mythiccraft = MythicMobs)
 */

const jsonRequest = (body: unknown) =>
  new Request("http://studio.local/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const callRun = async (body: unknown) => {
  const response = await runRoute(jsonRequest(body));
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
};

type StudioFile = { path: string; base64: string };

const created: string[] = [];
const remember = (name: string) => created.push(name);

afterAll(async () => {
  for (const name of created) {
    await deleteAssetRoute(new Request("http://x"), { params: Promise.resolve({ id: name }) });
  }
});

/** バスへ保存 → 保存されたアセット名を返す */
async function saveAsset(
  request: Record<string, unknown>,
  name: string,
): Promise<Record<string, unknown>> {
  const run = await callRun({ ...request, save: name });
  expect(run.status).toBe(200);
  expect(run.body.ok).toBe(true);
  remember(name);
  return run.body;
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

const isPng = (base64: string) => PNG_MAGIC.every((byte, index) => Buffer.from(base64, "base64")[index] === byte);

const fileAt = (files: StudioFile[], path: string) => files.find((file) => file.path === path);

describe("MOD bridge (texture asset → MOD build)", () => {
  it("embeds a bus texture into the Fabric MOD (mythic) and registers the item", async () => {
    const project = await saveAsset({ engine: "mythic", command: "sample", args: {} }, "test-mod-project");
    await saveAsset(
      { engine: "tex", command: "render", args: { preset: "luminous", sample: "stone", size: 16 } },
      "test-mod-texture",
    );

    const build = await callRun({
      engine: "mythic",
      command: "build",
      args: {},
      asset: ["test-mod-project", "test-mod-texture"],
    });
    expect(build.status).toBe(200);
    expect(build.body.ok).toBe(true);
    const files = build.body.files as StudioFile[];
    const texture = fileAt(files, "src/main/resources/assets/mymod/textures/item/custom_item.png");
    expect(texture).toBeTruthy();
    expect(isPng(texture!.base64)).toBe(true);
    // アイテム登録とモデル参照も同じ id で出力される
    const items = fileAt(files, "src/main/kotlin/com/example/mymod/ModItems.kt");
    expect(Buffer.from(items!.base64, "base64").toString("utf8")).toContain('register("custom_item"');
    const model = fileAt(files, "src/main/resources/assets/mymod/models/item/custom_item.json");
    expect(Buffer.from(model!.base64, "base64").toString("utf8")).toContain("mymod:item/custom_item");
    expect((build.body.data as { texture?: string }).texture).toBe("custom_item");

    // サンプル/テクスチャの保存結果も参照されている (回帰: バス経由であること)
    expect((project.asset as { files: string[] }).files.length).toBe(1);
  });

  it("decodes binary outputs (gradle-wrapper.jar / icon) as real bytes", async () => {
    const build = await callRun({ engine: "mythic", command: "build", args: {}, asset: "test-mod-project" });
    const files = build.body.files as StudioFile[];
    const jar = fileAt(files, "gradle/wrapper/gradle-wrapper.jar");
    expect(jar).toBeTruthy();
    const bytes = Buffer.from(jar!.base64, "base64");
    expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK"); // ZIP(JAR)のシグネチャ
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("keeps the previous behaviour when only the project JSON comes from the bus", async () => {
    const build = await callRun({ engine: "mythic", command: "build", args: {}, asset: "test-mod-project" });
    expect(build.status).toBe(200);
    const files = build.body.files as StudioFile[];
    expect(files.some((file) => /textures\/item\/.*\.png$/.test(file.path))).toBe(false);
    expect(build.body.text).toBe("wrote 29 files (mymod)");
  });

  it("targets a named item with textureTarget", async () => {
    const project = (await callRun({ engine: "mythic", command: "sample", args: {} })).body;
    const sample = (project.data ?? null) as Record<string, unknown> | null;
    const spec = (await callRun({ engine: "mythic", command: "build", args: { project: sample } })).body;
    expect(spec.ok).toBe(true);

    // アイテムを1つ持つプロジェクトを組み立て、その id へ差し込む
    const { newItem } = await import("@/lib/compat/engines/modforge/mod/catalog");
    const withItem = { ...(sample as Record<string, unknown>) };
    withItem.items = [{ ...newItem("mymod"), id: "bus_blade", name: "Bus Blade" }];
    const build = await callRun({
      engine: "mythic",
      command: "build",
      args: { project: withItem, texture: "iVBORw0KGgo=", textureTarget: "bus_blade" },
    });
    // 8byte の PNG はヘッダのみで不正ではないため通る (実PNGの検証は次のケース)
    expect(build.status).toBe(200);
    const files = build.body.files as StudioFile[];
    expect(fileAt(files, "src/main/resources/assets/mymod/textures/item/bus_blade.png")).toBeTruthy();
  });

  it("ignores a non-PNG payload instead of writing a broken texture", async () => {
    const sample = ((await callRun({ engine: "mythic", command: "sample", args: {} })).body.data ?? {}) as Record<string, unknown>;
    const missing = await callRun({
      engine: "mythic",
      command: "build",
      args: { project: sample, texture: "not-an-image" },
    });
    expect(missing.status).toBe(200); // PNG以外は「未指定」扱い = 従来どおりビルドは成功する
    const files = missing.body.files as StudioFile[];
    expect(files.some((file) => /textures\/item\/.*\.png$/.test(file.path))).toBe(false);
  });

  it("copies a bus texture into the MythicMobs MOD tree (mythiccraft)", async () => {
    await saveAsset({ engine: "mythiccraft", command: "sample", args: { name: "texmod" } }, "test-mc-project");
    const build = await callRun({
      engine: "mythiccraft",
      command: "build",
      args: {},
      asset: ["test-mc-project", "test-mod-texture"],
    });
    expect(build.status).toBe(200);
    const files = build.body.files as StudioFile[];
    const texture = fileAt(files, "src/main/resources/assets/texmod/textures/item/custom_item.png");
    expect(texture).toBeTruthy();
    expect(isPng(texture!.base64)).toBe(true);
  });
});
