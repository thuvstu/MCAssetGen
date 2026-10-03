import { StudioApp } from "@/components/studio-app";
import { getMasterwork } from "@/lib/masterworks";
import { PALETTES, SIGNATURES } from "@/lib/styles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "スタジオ",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ signature?: string; palette?: string; masterwork?: string }>;
}) {
  const { signature, palette, masterwork } = await searchParams;
  return (
    <StudioApp
      initialSignature={SIGNATURES.some((s) => s.id === signature) ? signature : undefined}
      initialPalette={PALETTES.some((p) => p.id === palette) ? palette : undefined}
      initialMasterwork={masterwork && getMasterwork(masterwork) ? masterwork : undefined}
    />
  );
}
