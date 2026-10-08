import Link from "next/link";
import EngineConsole from "@/components/studio/engine-console";
import { listEngines } from "@/lib/studio/dispatch";

export const dynamic = "force-dynamic";

/**
 * Unified studio hub — every engine ported into the studio (MERGE_PLAN) with a
 * console that runs its commands through `/api/studio/run`.
 */
export default function EnginesPage() {
  const engines = listEngines();
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <nav className="mx-auto flex w-full max-w-4xl items-center justify-between p-4 text-sm">
        <Link className="underline" href="/">
          ← VoxelForge 3Dスタジオ
        </Link>
        <span className="opacity-70">{engines.length} engines</span>
      </nav>
      <EngineConsole engines={engines} />
    </main>
  );
}
