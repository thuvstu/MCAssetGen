import { listEngines } from "@/lib/studio/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Catalog of every engine bundled into the studio, for the hub UI and the CLI. */
export async function GET() {
  return Response.json({ ok: true, engines: listEngines() });
}
