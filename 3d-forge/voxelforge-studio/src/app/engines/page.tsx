import Link from "next/link";
import EngineConsole from "@/components/studio/engine-console";
import { listEngines } from "@/lib/studio/dispatch";

export const dynamic = "force-dynamic";

/**
 * 統合エンジンコンソール。
 * 全エンジンを `/api/studio/run` 経由で実行し、出力はアセットバスへ保存できる。
 */
export default function EnginesPage() {
  const engines = listEngines();
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between p-4 text-sm">
        <span className="flex gap-4">
          <Link className="underline" href="/">
            ← VoxelForge 3Dスタジオ
          </Link>
          <Link className="underline" href="/studios">
            スタジオ一覧
          </Link>
          <Link className="underline" href="/assets">
            アセットバス
          </Link>
        </span>
        <span className="opacity-70">{engines.length} engines</span>
      </nav>
      <EngineConsole engines={engines} />
    </main>
  );
}
