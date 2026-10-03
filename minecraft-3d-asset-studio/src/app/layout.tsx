import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minecraft 3D Model Forge - Blockbench & Java/Bedrock 3D Studio",
  description:
    "Generate, customize, and edit high-quality 3D Minecraft models with UV atlas pixel textures (16-128px), procedural magic effects, floating ornaments, animations, and Blockbench .bbmodel export.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-[#12141a] text-neutral-200 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
