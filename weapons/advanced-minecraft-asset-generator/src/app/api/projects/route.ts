import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { validateProjectInput } from "@/lib/editor/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
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
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = validateProjectInput(body);
  if (!input) return NextResponse.json({ error: "invalid project payload" }, { status: 400 });
  const [row] = await db.insert(projects).values(input).returning();
  return NextResponse.json(row, { status: 201 });
}
