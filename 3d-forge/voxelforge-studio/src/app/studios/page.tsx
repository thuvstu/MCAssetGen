import Link from "next/link";
import { STUDIOS } from "@/lib/studios";

export const metadata = { title: "スタジオ一覧 — VoxelForge" };

/**
 * 統合スタジオの入口。
 * ここから各スタジオのGUI (元アプリをそのまま取り込んだもの) へ移動する。
 */
export default function StudiosPage() {
  const groups = [...new Set(STUDIOS.map((entry) => entry.group))];
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">統合スタジオ</h1>
        <p className="text-sm opacity-70">
          元アプリのGUIをそのまま取り込んでいます (機能も見た目も原本どおり)。
          生成エンジンは共通API/CLIからも使えます。
        </p>
      </header>

      {groups.map((group) => (
        <section key={group} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold opacity-70">{group}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STUDIOS.filter((entry) => entry.group === group).map((entry) => (
              <li key={entry.id} className="rounded border p-3 text-sm">
                {entry.status === "ported" ? (
                  <Link className="font-medium underline" href={`/studios/${entry.id}`}>
                    {entry.label}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.label}</span>
                )}
                <span className="ml-2 rounded bg-black/10 px-1 text-xs">
                  {entry.status === "ported" ? "GUI取り込み済" : "エンジン統合済 / GUI移植待ち"}
                </span>
                <p className="mt-1 opacity-70">{entry.description}</p>
                <p className="mt-1 font-mono text-xs opacity-50">{entry.origin}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-60">
        <Link className="underline" href="/">
          VoxelForge ホーム (モデル制作)
        </Link>
        <Link className="underline" href="/engines">
          エンジンコンソール
        </Link>
        <Link className="underline" href="/assets">
          アセットバス (スタジオ間の受け渡し)
        </Link>
      </footer>
    </main>
  );
}
