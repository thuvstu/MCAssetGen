import type { PartId } from "../lib/armorTypes";
import { PART_LABELS } from "../lib/armorTypes";
import { Button } from "./ui";

const ICON_ORDER: PartId[] = ["helmet", "chest", "leggings", "boots"];

interface Props {
  icons: Record<PartId, string>;
  size: number;
  onDownload: (part: PartId) => void;
  onDownloadAll: () => void;
}

export function IconView({ icons, size, onDownload, onDownloadAll }: Props) {
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[#e7e2d4]">アイテムテクスチャ / {size} x {size}</h3>
          <p className="mt-2 text-[11px] leading-relaxed text-[#929b91]">
            16ピクセルで描いた造形を、選んだ解像度へニアレストネイバーで拡大します。
          </p>
        </div>
        <Button variant="secondary" onClick={onDownloadAll}>
          4点まとめて保存
        </Button>
      </div>

      <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
        {ICON_ORDER.map((part) => (
          <div key={part} className="flex items-start gap-5 border-t border-[#41493f] pt-5">
            <div
              className="flex h-[154px] w-[154px] shrink-0 items-center justify-center border border-[#50594d]"
              style={{ backgroundImage: "repeating-conic-gradient(#394038 0% 25%, #313831 0% 50%)", backgroundSize: "18px 18px" }}
            >
              <img src={icons[part]} alt={PART_LABELS[part]} className="h-[120px] w-[120px]" style={{ imageRendering: "pixelated" }} draggable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="eyebrow mb-1">{part.toUpperCase()}</div>
              <h4 className="text-[13px] text-[#e9e5d9]">{PART_LABELS[part]}</h4>
              <div className="mt-4 flex h-[44px] w-[44px] items-center justify-center border border-[#5c6557] bg-[#373e37]">
                <img src={icons[part]} alt="" className="h-8 w-8" style={{ imageRendering: "pixelated" }} draggable={false} />
              </div>
              <Button variant="ghost" className="mt-3 justify-start px-0" onClick={() => onDownload(part)}>
                PNG を保存  ↗
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
