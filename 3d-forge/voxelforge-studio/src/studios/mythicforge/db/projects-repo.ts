import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/studios/mythicforge/db";
import { projects } from "@/studios/mythicforge/db/schema";

/**
 * MODプロジェクトの保存。DATABASE_URL があれば Postgres、
 * 無ければプロセス内メモリ (再起動で消えるが全機能は動く)。
 */
export interface ProjectRow {
  id: string;
  name: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const globalForStore = globalThis as typeof globalThis & {
  __KEY__Projects?: Map<string, ProjectRow>;
};

const memoryStore = globalForStore.__KEY__Projects ?? new Map();
globalForStore.__KEY__Projects = memoryStore;

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

export async function addProject(name: string, data: unknown): Promise<string> {
  if (!db) {
    const now = new Date();
    const id = randomUUID();
    memoryStore.set(id, { id, name, data, createdAt: now, updatedAt: now });
    return id;
  }
  const [row] = await db.insert(projects).values({ name, data }).returning({ id: projects.id });
  return row.id;
}

export async function findProject(id: string): Promise<ProjectRow | null> {
  if (!db) return memoryStore.get(id) ?? null;
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function patchProject(
  id: string,
  patch: { name?: string; data?: unknown },
): Promise<{ id: string; updatedAt: Date } | null> {
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

export async function removeProject(id: string): Promise<void> {
  if (!db) {
    memoryStore.delete(id);
    return;
  }
  await db.delete(projects).where(eq(projects.id, id));
}
