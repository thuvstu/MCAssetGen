import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE3D — Minecraft 3Dモデル工房 / Blockbench Studio",
  description:
    "剣・防具・魔導杖・浮遊物・パーティクル・アニメーションを細かく指定して、BlockbenchとMinecraftでそのまま使える高品質3Dモデルとリソースパックを生成する工房。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Old+Mincho:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink text-bone antialiased">{children}</body>
    </html>
  );
}
