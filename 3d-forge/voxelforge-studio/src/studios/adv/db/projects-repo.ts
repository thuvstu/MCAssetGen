import { desc, eq } from "drizzle-orm";
import { db } from "@/studios/adv/db";
import { projects, type Project } from "@/studios/adv/db/schema";
import type { SafeProjectInput } from "@/studios/adv/lib/editor/validation";

/**
 * Advanced Weapon のプロジェクト保存。
 * DATABASE_URL があれば Postgres、無ければプロセス内メモリ (再起動で消える)。
 * 返す形は元API (drizzle の行) と同じフィールド構成を保つ。
 */
const globalForStore = globalThis as typeof globalThis & {
  __advStudioProjects?: Map<number, Project>;
  __advStudioSeq?: { value: number };
};

const memoryStore: Map<number, Project> =
  globalForStore.__advStudioProjects ?? new Map();
globalForStore.__advStudioProjects = memoryStore;
const seq = globalForStore.__advStudioSeq ?? { value: 0 };
globalForStore.__advStudioSeq = seq;

export const storage = db ? "postgres" : "memory";

export async function listProjects() {
  if (!db) {
    return [...memoryStore.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 200);
  }
  return db
    .select({
      id: projects.id,
      name: projects.name,
      kind: projects.kind,
      width: projects.width,
      height: projects.height,
      thumbnail: projects.thumbnail,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(200);
}

export async function insertProject(input: SafeProjectInput): Promise<Project> {
  if (!db) {
    const now = new Date();
    seq.value += 1;
    const row: Project = {
      id: seq.value,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.set(row.id, row);
    return row;
  }
  const [row] = await db.insert(projects).values(input).returning();
  return row;
}

export async function getProject(id: number): Promise<Project | null> {
  if (!db) return memoryStore.get(id) ?? null;
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function updateProject(
  id: number,
  input: SafeProjectInput,
): Promise<Project | null> {
  if (!db) {
    const current = memoryStore.get(id);
    if (!current) return null;
    const row: Project = { ...current, ...input, updatedAt: new Date() };
    memoryStore.set(id, row);
    return row;
  }
  const [row] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProject(id: number): Promise<void> {
  if (!db) {
    memoryStore.delete(id);
    return;
  }
  await db.delete(projects).where(eq(projects.id, id));
}
