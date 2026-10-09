import Link from "next/link";
import { listAssets } from "@/lib/assets-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "アセットバス — VoxelForge" };

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * アセットバス — スタジオ間で受け渡す成果物の一覧。
 *
 * ここに並ぶものはどのスタジオからでも `--asset <名前>` (CLI) /
 * 「アセットから入力」 (コンソール) で取り出せる。
 */
export default function AssetsPage() {
  const assets = listAssets();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">アセットバス</h1>
        <p className="text-sm opacity-70">
          スタジオの出力をここに保存すると、別のスタジオの入力として使えます。
          CLI は{" "}
          <code className="rounded bg-black/10 px-1">--save 名前</code> で保存、
          <code className="ml-1 rounded bg-black/10 px-1">--asset 名前</code> で取り出し。
        </p>
      </header>

      {assets.length === 0 ? (
        <p className="rounded border p-4 text-sm opacity-70">
          まだアセットがありません。例:{" "}
          <code className="rounded bg-black/10 px-1">
            npm run mcasset -- tex:render --save grass --out mm/grass.png
          </code>
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id} className="flex flex-col gap-2 rounded border p-3 text-sm">
              <div className="flex items-center gap-2">
                {asset.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-10 w-10 border bg-black/5 [image-rendering:pixelated]"
                    src={`data:image/png;base64,${asset.thumb}`}
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded border text-xs opacity-60">
                    {asset.files.length > 1 ? `${asset.files.length}件` : "bin"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{asset.name}</p>
                  <p className="text-xs opacity-60">
                    {asset.studio}:{asset.kind} ・ {formatBytes(asset.bytes)}
                  </p>
                </div>
              </div>
              <ul className="text-xs opacity-70">
                {asset.files.slice(0, 3).map((file) => (
                  <li key={file} className="truncate font-mono">
                    {file}
                  </li>
                ))}
                {asset.files.length > 3 ? <li>ほか {asset.files.length - 3} 件</li> : null}
              </ul>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a className="rounded border px-2 py-0.5 underline" href={`/api/assets/${asset.id}`}>
                  JSON取得
                </a>
                <Link className="rounded border px-2 py-0.5 underline" href={`/engines?asset=${encodeURIComponent(asset.name)}`}>
                  エンジンで使う
                </Link>
                <span className="opacity-50">{asset.createdAt.slice(0, 16).replace("T", " ")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="text-xs opacity-60">
        <Link className="underline" href="/studios">
          スタジオ一覧
        </Link>
        {" ・ "}
        <Link className="underline" href="/engines">
          エンジンコンソール
        </Link>
        {" ・ "}
        <Link className="underline" href="/">
          VoxelForge ホーム
        </Link>
        {" ・ 保存先: リポジトリ内 .mcasset-assets/ (gitignore済)"}
      </footer>
    </main>
  );
}
