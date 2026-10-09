import { afterAll, describe, expect, it } from "vitest";
import { GET as listAssetsRoute, POST as saveAssetsRoute } from "@/app/api/assets/route";
import { DELETE as deleteAssetRoute, GET as getAssetRoute } from "@/app/api/assets/[id]/route";
import { POST as runRoute } from "@/app/api/studio/run/route";

/**
 * アセットバス = スタジオ間連携。
 *
 * あるエンジンの出力をバスへ保存し、**別のエンジン**がそれを入力として
 * 取り出せることを、実際のルートハンドラ経由で検証する。
 */

const jsonRequest = (body: unknown) =>
  new Request("http://studio.local/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const callRun = async (body: unknown) => {
  const response = await runRoute(jsonRequest(body));
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

const jsonOf = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

const created: string[] = [];
const remember = (name: string) => created.push(name);

afterAll(async () => {
  for (const name of created) await deleteAssetRoute(new Request("http://x"), { params: Promise.resolve({ id: name }) });
});

describe("asset bus (studio-to-studio handoff)", () => {
  it("saves an engine output and lists it with a thumbnail", async () => {
    const run = await callRun({ engine: "tex", command: "render", args: { preset: "luminous", sample: "stone", size: 16 }, save: "test-tex-asset" });
    expect(run.status).toBe(200);
    expect(run.body.ok).toBe(true);
    const asset = run.body.asset as { name: string; files: string[]; thumb?: string };
    expect(asset.name).toBe("test-tex-asset");
    expect(asset.files.length).toBe(1);
    expect(asset.thumb).toBeTruthy(); // 単一PNGなのでサムネイルが付く
    remember("test-tex-asset");

    const list = await jsonOf(await listAssetsRoute());
    const names = (list.assets as { name: string }[]).map((entry) => entry.name);
    expect(names).toContain("test-tex-asset");
  });

  it("feeds the saved asset into a different engine", async () => {
    // material (素材) の出力を保存 → tex (テクスチャ) が取り込む
    const source = await callRun({
      engine: "material",
      command: "render",
      args: { preset: "iron", shape: "ingot", seed: 4 },
      save: "test-cross-asset",
    });
    expect(source.body.ok).toBe(true);
    remember("test-cross-asset");

    const consumed = await callRun({
      engine: "tex",
      command: "convert",
      args: { palette: "auto", colors: 8, paletteKey: undefined },
      asset: "test-cross-asset",
    });
    expect(consumed.status).toBe(200);
    expect(consumed.body.ok).toBe(true);
    expect(String(consumed.body.text)).toContain("converted");
  });

  it("passes a saved JSON project into a build command", async () => {
    const sample = await callRun({ engine: "mythic", command: "sample", args: {}, save: "test-project-asset" });
    expect(sample.body.ok).toBe(true);
    remember("test-project-asset");

    const built = await callRun({ engine: "mythic", command: "build", args: {}, asset: "test-project-asset" });
    expect(built.status).toBe(200);
    expect(built.body.ok).toBe(true);
    expect((built.body.files as unknown[]).length).toBeGreaterThan(10);
  });

  it("returns the asset body, then deletes it", async () => {
    const fetched = await getAssetRoute(new Request("http://x"), { params: Promise.resolve({ id: "test-tex-asset" }) });
    expect(fetched.status).toBe(200);
    const asset = (await jsonOf(fetched)).asset as { files: { base64: string }[] };
    expect(asset.files[0].base64.length).toBeGreaterThan(100);

    const removed = await deleteAssetRoute(new Request("http://x"), { params: Promise.resolve({ id: "test-tex-asset" }) });
    expect(removed.status).toBe(200);
    created.splice(created.indexOf("test-tex-asset"), 1);

    const missing = await getAssetRoute(new Request("http://x"), { params: Promise.resolve({ id: "test-tex-asset" }) });
    expect(missing.status).toBe(404);
  });

  it("accepts a manual upload (any studio / CLI)", async () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const response = await saveAssetsRoute(
      jsonRequest({ name: "test-upload", studio: "manual", kind: "upload", files: [{ path: "pixel.png", base64: png }] }),
    );
    expect(response.status).toBe(201);
    const body = await jsonOf(response);
    expect((body.asset as { name: string }).name).toBe("test-upload");
    remember("test-upload");
  });

  it("rejects unknown assets and empty payloads", async () => {
    const unknown = await callRun({ engine: "tex", command: "convert", args: {}, asset: "no-such-asset-xyz" });
    expect(unknown.status).toBe(400);
    expect(String(unknown.body.error)).toContain("見つかりません");

    const empty = await saveAssetsRoute(jsonRequest({ name: "empty", files: [] }));
    expect(empty.status).toBe(400);
  });
});
