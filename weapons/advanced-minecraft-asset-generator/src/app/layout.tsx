import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MC Asset Forge — マイクラ武器テクスチャ 2D/3D メーカー",
  description:
    "Hypixel Skyblock風・バニラ+の武器テクスチャをプロシージャル生成し、ピクセル編集・アニメーション・2D→3Dモデル再構築・リソースパック出力まで行えるツール。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-[#0b0b12] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
