import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "UV ATLAS FORGE ｜ 型押し工房 — Minecraft 3Dモデル生成",
  description:
    "UVアトラスと型（剣・防具・杖・魔法陣・浮遊装飾）を指定して、Blockbench / Minecraft で使える高品質3Dモデルとテクスチャアトラスをブラウザ上で組み上げる工房。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
          precedence="default"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
