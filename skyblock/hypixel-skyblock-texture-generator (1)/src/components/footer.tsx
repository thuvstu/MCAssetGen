import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line/70 bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          SkyForge はオリジナルのピクセルアートを生成します。既存パックのテクスチャは使用していません。
        </p>
        <p className="flex gap-4">
          <Link href="/guide" className="hover:text-gold-2">
            導入ガイド
          </Link>
          <span>Hypixel / SkyBlock は各権利者の商標です。</span>
        </p>
      </div>
    </footer>
  );
}
