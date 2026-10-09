import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/studios/skyforge/db";
import {
  bumpPackDownloads,
  deletePack,
  deleteTexturesByPack,
  findTextureByItem,
  getPack,
  insertPack,
  insertTexture,
  likePack,
  listPacksByCreated,
  listTexturesByPack,
  updatePack,
} from "@/studios/skyforge/db/repo";
import { getPackDetail, getPackMeta, listPublicPacks } from "@/studios/skyforge/lib/data";

/**
 * SkyForge の保存庫。
 *
 * 元アプリは Postgres 必須だったが、統合スタジオでは DATABASE_URL が無い環境
 * (この開発環境) でも全機能が動く必要がある。ここでは repo のメモリ経路が
 * パック/テクスチャの CRUD・いいね・公開一覧を正しく扱えることを検証する。
 */

const packRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `pack ${id}`,
  author: "tester",
  description: "",
  resolution: 16,
  styleId: "reborn_flare",
  signatureId: "reborn_clean",
  isPublic: true,
  downloads: 0,
  likes: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const textureRow = (id: string, packId: string, overrides: Record<string, unknown> = {}) => ({
  id,
  packId,
  itemId: "hyperion",
  name: "Hyperion",
  category: "sword",
  rarity: "legendary",
  styleMix: [{ id: "reborn_flare", weight: 1 }],
  signatureMix: [{ id: "reborn_clean", weight: 1 }],
  seed: 1,
  resolution: 16,
  pixels: new Array(16 * 16 * 4).fill(128),
  hueShift: 0,
  glow: 40,
  metallic: 45,
  chaos: 25,
  templateId: "classic",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("skyforge store (memory fallback)", () => {
  it("runs without DATABASE_URL", () => {
    expect(db).toBeNull();
  });

  beforeEach(async () => {
    await deleteTexturesByPack("test-pack");
    await deletePack("test-pack");
  });

  it("stores, updates, likes and deletes a pack", async () => {
    await insertPack(packRow("test-pack"));
    expect((await getPack("test-pack"))?.name).toBe("pack test-pack");

    await updatePack("test-pack", { name: "renamed", likes: 5 });
    expect((await getPack("test-pack"))?.name).toBe("renamed");

    const liked = await likePack("test-pack");
    expect(liked?.likes).toBe(6);
    expect(await likePack("missing-pack")).toBeNull();

    await bumpPackDownloads("test-pack");
    expect((await getPack("test-pack"))?.downloads).toBe(1);

    await deletePack("test-pack");
    expect(await getPack("test-pack")).toBeNull();
  });

  it("keeps textures in sync with their pack (find / list / cascade delete)", async () => {
    await insertPack(packRow("test-pack"));
    await insertTexture(textureRow("tex-1", "test-pack"));
    await insertTexture(textureRow("tex-2", "test-pack", { itemId: "astraea" }));

    expect(await listTexturesByPack("test-pack")).toHaveLength(2);
    expect((await findTextureByItem("test-pack", "astraea"))?.id).toBe("tex-2");
    expect(await findTextureByItem("test-pack", "nope")).toBeNull();

    await deleteTexturesByPack("test-pack");
    expect(await listTexturesByPack("test-pack")).toHaveLength(0);
  });

  it("orders the public listing by likes and hides private packs", async () => {
    await insertPack(packRow("test-public", { likes: 1 }));
    await insertPack(packRow("test-popular", { likes: 9 }));
    await insertPack(packRow("test-private", { likes: 99, isPublic: false }));
    await insertTexture(textureRow("tex-public", "test-public"));

    const listed = (await listPublicPacks()).filter((pack) => pack.id.startsWith("test-"));
    expect(listed.map((pack) => pack.id)).toEqual(["test-popular", "test-public"]);
    expect(listed[1].textures.map((texture) => texture.itemId)).toEqual(["hyperion"]);

    const meta = await getPackMeta("test-public");
    expect(meta?.textures).toHaveLength(1);

    const detail = await getPackDetail("test-public");
    expect(detail?.textures[0].pixels).toHaveLength(16 * 16 * 4);
    expect(await getPackMeta("missing-pack")).toBeNull();

    await deleteTexturesByPack("test-public");
    await deleteTexturesByPack("test-popular");
    await deleteTexturesByPack("test-private");
    await deletePack("test-public");
    await deletePack("test-popular");
    await deletePack("test-private");
  });

  it("lists packs newest-first for the studio picker", async () => {
    const old = new Date(Date.now() - 60_000);
    await insertPack(packRow("test-old", { createdAt: old, updatedAt: old }));
    await insertPack(packRow("test-new"));
    const ids = (await listPacksByCreated()).map((pack) => pack.id).filter((id) => id.startsWith("test-"));
    expect(ids[0]).toBe("test-new");
    await deletePack("test-old");
    await deletePack("test-new");
  });
});
