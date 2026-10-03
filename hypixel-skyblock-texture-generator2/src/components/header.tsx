import Link from "next/link";

const LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/studio", label: "スタジオ" },
  { href: "/gallery", label: "ギャラリー" },
  { href: "/guide", label: "ガイド" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-abyss/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-gold/40 bg-panel shadow-[0_0_18px_rgba(228,184,74,0.25)]">
            <svg viewBox="0 0 16 16" className="h-6 w-6" aria-hidden>
              <rect x="1" y="11" width="14" height="3" fill="#e4b84a" />
              <rect x="6" y="8" width="4" height="3" fill="#c9a227" />
              <rect x="3" y="6" width="10" height="2" fill="#8a6a18" />
              <rect x="11" y="2" width="2" height="5" fill="#5ef0ff" />
              <rect x="10" y="1" width="3" height="2" fill="#ff6bff" />
            </svg>
          </span>
          <span>
            <span className="block font-display text-[13px] tracking-[0.22em] text-gold-2">
              SKYFORGE
            </span>
            <span className="block text-[10px] tracking-[0.18em] text-paper/50">
              SKYBLOCK PACK MAKER
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-paper/70 transition hover:text-gold-2"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/studio"
            className="ml-2 hidden border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs tracking-wider text-gold-2 sm:inline"
          >
            鍛造する
          </Link>
        </nav>
      </div>
    </header>
  );
}
