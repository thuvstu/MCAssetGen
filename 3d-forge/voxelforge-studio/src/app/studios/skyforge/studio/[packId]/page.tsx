import { notFound } from "next/navigation";
import { StudioApp } from "@/studios/skyforge/components/studio-app";
import { getPackDetail } from "@/studios/skyforge/lib/data";

export const dynamic = "force-dynamic";

export default async function EditStudioPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPackDetail(packId);
  if (!pack) notFound();
  return <StudioApp initialPack={pack} />;
}
