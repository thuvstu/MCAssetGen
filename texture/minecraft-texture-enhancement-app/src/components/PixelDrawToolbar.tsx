import { useState } from "react";
import { Icon, Btn, ColorField, Toggle } from "./ui";

export type ToolMode = "pencil" | "eraser" | "eyedropper" | "bucket";

interface Props {
  color: string;
  onChangeColor: (c: string) => void;
  tool: ToolMode;
  onChangeTool: (t: ToolMode) => void;
  active: boolean;
  onToggleActive: (v: boolean) => void;
  size: number;
}

export default function PixelDrawToolbar({
  color,
  onChangeColor,
  tool,
  onChangeTool,
  active,
  onToggleActive,
}: Props) {
  const [symmetry, setSymmetry] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[4px] border border-[var(--line2)] bg-[#121721] p-1.5 shadow-md">
      <Btn
        size="sm"
        active={active}
        accent="#ef5f8c"
        onClick={() => onToggleActive(!active)}
        title="直接手描きペイントモードを切り替え"
      >
        <Icon name="brush" className="h-3.5 w-3.5" />
        {active ? "手描きモードON" : "手描きペイント"}
      </Btn>

      {active && (
        <>
          <div className="h-4 w-px bg-[var(--line2)]" />

          <Btn
            size="sm"
            active={tool === "pencil"}
            accent="#f5a63c"
            onClick={() => onChangeTool("pencil")}
            title="ペンシル (1px ドット描画)"
          >
            <span className="font-pixel text-[11px]">ペン</span>
          </Btn>

          <Btn
            size="sm"
            active={tool === "eraser"}
            accent="#ef5f8c"
            onClick={() => onChangeTool("eraser")}
            title="消しゴム (透明化)"
          >
            <span className="font-pixel text-[11px]">消しゴム</span>
          </Btn>

          <Btn
            size="sm"
            active={tool === "bucket"}
            accent="#37d6c4"
            onClick={() => onChangeTool("bucket")}
            title="塗りつぶしバケツ"
          >
            <span className="font-pixel text-[11px]">バケツ</span>
          </Btn>

          <Btn
            size="sm"
            active={tool === "eyedropper"}
            accent="#59a7ff"
            onClick={() => onChangeTool("eyedropper")}
            title="スポイト (色取得)"
          >
            <Icon name="droplet" className="h-3 w-3" />
          </Btn>

          <div className="h-4 w-px bg-[var(--line2)]" />

          <ColorField label="" value={color} onChange={onChangeColor} />

          <Toggle
            label="左右対称"
            value={symmetry}
            onChange={setSymmetry}
            accent="#b6e14f"
          />
        </>
      )}
    </div>
  );
}
