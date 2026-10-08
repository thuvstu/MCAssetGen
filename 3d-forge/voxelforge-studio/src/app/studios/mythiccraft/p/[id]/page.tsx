import Editor from "@/studios/mythiccraft/components/editor/Editor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Editor id={Number(id)} />;
}
