import Studio from "@/components/studio";
import { generateModel } from "@/lib/model-generator";
import { DEFAULT_SETTINGS } from "@/lib/model-types";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const initialModel = generateModel({
    ...DEFAULT_SETTINGS,
    name: "Crystal Sword",
  });
  return <Studio initialModel={initialModel} />;
}
