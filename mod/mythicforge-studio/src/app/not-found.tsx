import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl">⛏</p>
      <h1 className="text-xl font-bold">ページが見つかりません</h1>
      <Link href="/" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400">ホームへ戻る</Link>
    </div>
  );
}
