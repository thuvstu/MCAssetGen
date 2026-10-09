import { desc, eq } from "drizzle-orm";
import { db } from "@/studios/mythiccraft/db";
import { projects } from "@/studios/mythiccraft/db/schema";

/**
 * MythicCraft のプロジェクト保存。
 * DATABASE_URL があれば Postgres、無ければプロセス内メモリ (serial id を再現)。
 */
export interface ProjectRow {
  id: number;
  name: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const globalForStore = globalThis as typeof globalThis & {
  __mythiccraftProjects?: Map<number, ProjectRow>;
  __mythiccraftSeq?: { value: number };
};

const memoryStore: Map<number, ProjectRow> =
  globalForStore.__mythiccraftProjects ?? new Map();
globalForStore.__mythiccraftProjects = memoryStore;
const seq = globalForStore.__mythiccraftSeq ?? { value: 0 };
globalForStore.__mythiccraftSeq = seq;

export const storage = db ? "postgres" : "memory";

export async function listProjectRows() {
  if (!db) {
    return [...memoryStore.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((row) => ({ id: row.id, name: row.name, data: row.data, updatedAt: row.updatedAt }));
  }
  return db
    .select({ id: projects.id, name: projects.name, data: projects.data, updatedAt: projects.updatedAt })
    .from(projects)
    .orderBy(desc(projects.updatedAt));
}

export async function addProject(name: string, data: unknown): Promise<number> {
  if (!db) {
    const now = new Date();
    seq.value += 1;
    const id = seq.value;
    memoryStore.set(id, { id, name, data, createdAt: now, updatedAt: now });
    return id;
  }
  const [row] = await db.insert(projects).values({ name, data }).returning({ id: projects.id });
  return row.id;
}

export async function findProject(id: number): Promise<ProjectRow | null> {
  if (!db) return memoryStore.get(id) ?? null;
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function patchProject(
  id: number,
  patch: { name?: string; data?: unknown },
): Promise<{ id: number; updatedAt: Date } | null> {
  if (!db) {
    const row = memoryStore.get(id);
    if (!row) return null;
    const next: ProjectRow = { ...row, ...patch, updatedAt: new Date() };
    memoryStore.set(id, next);
    return { id, updatedAt: next.updatedAt };
  }
  const [row] = await db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning({ id: projects.id, updatedAt: projects.updatedAt });
  return row ?? null;
}

export async function removeProject(id: number): Promise<void> {
  if (!db) {
    memoryStore.delete(id);
    return;
  }
  await db.delete(projects).where(eq(projects.id, id));
}
