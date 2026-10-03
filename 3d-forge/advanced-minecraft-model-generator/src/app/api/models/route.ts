import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedModels } from "@/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const theme = searchParams.get("theme");
    const search = searchParams.get("search")?.trim();

    const conditions = [];
    if (category && category !== "all") conditions.push(eq(savedModels.category, category));
    if (theme && theme !== "all") conditions.push(eq(savedModels.theme, theme));
    if (search) {
      conditions.push(
        or(
          sql`title ilike ${"%" + search + "%"}`,
          sql`description ilike ${"%" + search + "%"}`
        )!
      );
    }

    const rows = await db
      .select()
      .from(savedModels)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(savedModels.updatedAt))
      .limit(60);

    return NextResponse.json({ success: true, models: rows });
  } catch (error) {
    console.error("vault read failed", error);
    return NextResponse.json({ success: true, models: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, theme, config, previewDataUrl } = body;

    if (!title || !category || !config) {
      return NextResponse.json(
        { success: false, error: "title / category / config は必須です" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(savedModels)
      .values({
        title: String(title).slice(0, 160),
        description: description ? String(description).slice(0, 1200) : null,
        category,
        theme: theme || "void",
        config,
        previewDataUrl: previewDataUrl || null,
      })
      .returning();

    return NextResponse.json({ success: true, model: row }, { status: 201 });
  } catch (error) {
    console.error("vault write failed", error);
    return NextResponse.json(
      { success: false, error: "保存に失敗しました" },
      { status: 500 }
    );
  }
}
