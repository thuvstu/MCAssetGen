import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MythicCraft Studio — Minecraft 1.21.1 Fabric Mod ビルダー",
  description: "コーディング不要で MythicMobs 風スキルシステム付きの Fabric Mod (Kotlin) を作成",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
