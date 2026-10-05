"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl">⚠️</p>
      <h1 className="text-xl font-bold">問題が発生しました</h1>
      <p className="max-w-md text-sm text-slate-400">編集内容は自動保存されています。再読み込みしても直らない場合は、ホームからプロジェクトを開き直してください。</p>
      {error.digest && <p className="font-code text-[11px] text-slate-600">ref: {error.digest}</p>}
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400">再試行</button>
        <Link href="/" className="rounded-lg border border-[#2b3547] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">ホームへ</Link>
      </div>
    </div>
  );
}
