import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, storageMode } from "@/db";
import { projects } from "@/db/schema";
import type { GeneratedModel, ModelSettings } from "@/lib/model-types";

/**
 * 保存済みモデルのリポジトリ。
 * DATABASE_URL があれば Postgres、無ければプロセス内メモリに保存する
 * (メモリ保存は再起動で消えるが、スタジオの全機能は動く)。
 */
export type ProjectRecord = {
  id: string;
  name: string;
  kind: string;
  settings: ModelSettings;
  model: GeneratedModel;
  createdAt: Date;
  updatedAt: Date;
};

export type NewProject = {
  name: string;
  kind: string;
  settings: ModelSettings;
  model: GeneratedModel;
};

/** dev の HMR をまたいでも消えないよう globalThis に置く */
const globalForStore = globalThis as typeof globalThis & {
  __voxelForgeMemoryProjects?: Map<string, ProjectRecord>;
};

const memoryStore: Map<string, ProjectRecord> =
  globalForStore.__voxelForgeMemoryProjects ?? new Map();
globalForStore.__voxelForgeMemoryProjects = memoryStore;

export const storage = storageMode;

function fromMemory(id: string): ProjectRecord | null {
  return memoryStore.get(id) ?? null;
}

export async function listProjects(limit: number): Promise<ProjectRecord[]> {
  if (!db) {
    return [...memoryStore.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
}

export async function insertProject(input: NewProject): Promise<ProjectRecord> {
  if (!db) {
    const now = new Date();
    const record: ProjectRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.set(record.id, record);
    return record;
  }
  const [project] = await db
    .insert(projects)
    .values(input)
    .returning();
  return project;
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  if (!db) return fromMemory(id);
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));
  return project ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!db) return memoryStore.delete(id);
  const deleted = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });
  return deleted.length > 0;
}
