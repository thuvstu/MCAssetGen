import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-forge grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <p className="font-pixel text-xs tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-2 font-display text-3xl text-gold-2">この遺物は見つからない</h1>
        <Link href="/" className="mt-6 inline-block text-sm text-aqua">
          工房に戻る
        </Link>
      </div>
    </main>
  );
}
