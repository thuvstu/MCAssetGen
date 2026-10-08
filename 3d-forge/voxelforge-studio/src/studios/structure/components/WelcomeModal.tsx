import { useState } from "react";
import { Cuboid, MousePointerClick, Palette, FileBox, Sparkles, Upload, Plus, Puzzle, X } from "lucide-react";

interface Props {
  open: boolean;
  version: string;
  onClose: (dontShowAgain: boolean) => void;
  onPickSample: () => void;
  onNew: () => void;
  onOpenFile: (f: File) => void;
}

const STEPS = [
  { icon: Palette, title: "1. ブロックを選ぶ", body: "左のパレットから選択。MODブロックはIDを直接入力するだけで使えます。" },
  { icon: MousePointerClick, title: "2. 積む", body: "3Dビューで左クリック設置・右クリック削除。箱・球・対称配置・2Dレイヤー編集も。" },
  { icon: FileBox, title: "3. 書き出す", body: ".nbt またはデータパック zip を出力。書き出し前に内部でNBTを読み戻して検証します。" },
];

export default function WelcomeModal({ open, version, onClose, onPickSample, onNew, onOpenFile }: Props) {
  const [dontShow, setDontShow] = useState(false);
  if (!open) return null;

  const close = () => onClose(dontShow);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={close}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-800/60 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <button onClick={close} className="absolute right-3 top-3 rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="閉じる">
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-5 pt-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-700 shadow-lg shadow-emerald-900/60">
              <Cuboid className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-pixel text-xl font-bold tracking-wide text-white">Minecraft Asset Maker</h1>
              <p className="text-[11px] text-emerald-400">
                NBT構造物スタジオ <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">v{version}</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-zinc-400">
            ブラウザだけで Minecraft Java 版のストラクチャーファイル（.nbt）を作成・編集できます。
            palette / blocks / DataVersion / GZip といった難しい部分はすべて自動化。
            データはこのブラウザ内にのみ保存され、外部には送信されません。
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <Icon className="mb-1.5 h-4 w-4 text-emerald-400" />
                  <div className="text-[12px] font-bold text-white">{s.title}</div>
                  <div className="mt-0.5 text-[10.5px] leading-relaxed text-zinc-500">{s.body}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-fuchsia-900/50 bg-fuchsia-950/20 px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400">
            <Puzzle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-400" />
            <span>
              <span className="font-bold text-fuchsia-300">MOD対応：</span>
              <span className="font-mono text-zinc-300">mymod:ruby_block</span> のような仮IDをそのまま配置でき、後から一括でIDを差し替えられます。
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => {
                onPickSample();
                close();
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 py-2.5 text-[12px] font-black text-white shadow-lg shadow-emerald-900/50 transition hover:from-emerald-500 hover:to-green-500"
            >
              <Sparkles className="h-4 w-4" /> サンプルから始める
            </button>
            <button
              onClick={() => {
                onNew();
                close();
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-[12px] font-bold text-zinc-200 transition hover:border-emerald-600 hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" /> 空のキャンバス
            </button>
            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-[12px] font-bold text-zinc-200 transition hover:border-sky-600 hover:bg-zinc-800">
              <Upload className="h-4 w-4 text-sky-400" /> .nbt を開く
              <input
                type="file"
                accept=".nbt,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onOpenFile(f);
                    close();
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="accent-emerald-500" />
              次回から表示しない
            </label>
            <span>ヘッダーの「使い方」からいつでも確認できます</span>
          </div>
        </div>
      </div>
    </div>
  );
}
