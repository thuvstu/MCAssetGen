import Link from "next/link";
import { notFound } from "next/navigation";
import StudioHost from "@/components/studio/studio-host";
import { STUDIOS, studioById } from "@/lib/studios";
import { isPortedGui } from "@/lib/studio-components";

type RouteContext = { params: Promise<{ studio: string }> };

export function generateStaticParams() {
  return STUDIOS.map((entry) => ({ studio: entry.id }));
}

export async function generateMetadata({ params }: RouteContext) {
  const { studio } = await params;
  const entry = studioById(studio);
  return { title: entry ? `${entry.label} — VoxelForge` : "スタジオ — VoxelForge" };
}

/**
 * 取り込んだスタジオGUIの表示。
 * 上部に統合アプリの帯 (戻る/他のスタジオ) を出し、その下は元アプリそのまま。
 */
export default async function StudioPage({ params }: RouteContext) {
  const { studio } = await params;
  const entry = studioById(studio);
  if (!entry) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2 text-xs opacity-80">
        <Link className="underline" href="/studios">
          ← スタジオ一覧
        </Link>
        <span className="font-medium">{entry.label}</span>
        <span className="opacity-60">{entry.origin}</span>
        {!isPortedGui(entry.id) ? (
          <span className="rounded bg-amber-500/20 px-1">GUI移植待ち — エンジンは /engines で実行可</span>
        ) : null}
      </div>
      <div className="flex-1">
        <StudioHost id={entry.id} />
      </div>
    </div>
  );
}
