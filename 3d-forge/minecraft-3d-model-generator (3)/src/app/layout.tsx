import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "VoxelForge Studio | UVアトラス・型指定 Blockbench & Minecraft 3Dモデル生成アプリ",
  description:
    "UVアトラス解像度・材質や型（剣・大剣・日本刀・戦斧・ツルハシ・魔導杖など）を指定して、Blockbench (.bbmodel) や Minecraft Java Edition (.json / リソースパック.zip) で即利用できる高品質3Dボクセルモデルを生成・編集するWebスタジオ。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-[#0D0E12] text-[#F1F5F9] antialiased selection:bg-[#3B82F6] selection:text-white">
        {children}
      </body>
    </html>
  );
}
