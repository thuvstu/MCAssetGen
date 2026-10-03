"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  Layers3,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { TEMPLATES } from "@/lib/model-types";
import Modal from "@/components/ui/modal";
import { useStudioStore } from "../studio-context";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Box,
    title: "ベースの形を選ぶ",
    body: `${TEMPLATES.length}種類の形状。近代兵装、魔法、禍々しい武器など、検索とカテゴリで選べます。`,
  },
  {
    icon: Layers3,
    title: "あなたらしく仕上げる",
    body: "グラデーションと装飾を追加。3Dモデルのパーツもクリックして編集できます。",
  },
  {
    icon: Sparkles,
    title: "生成して、世界へ",
    body: "「モデルを生成」で保存。BlockbenchやMinecraft用の形式で書き出せます。",
  },
];

const FAQ = [
  {
    question: "どんな生成エンジンですか？",
    answer:
      "形状テンプレートを基にキューブを組み立てるパラメータ式エンジンです。外部生成AIは使用していません。ヒントの「ルビー・赤」「氷・青」「エメラルド・緑」「アメジスト・紫」で配色が変わり、文章とシードによって表面パターンが変化します。形状はパーツ編集で移動・サイズ変更・追加できます。さらに詳しい編集はBlockbenchでも行えます。",
    open: true,
  },
  {
    question: "UVアトラスにはどんな画像が使えますか？",
    answer:
      "16〜1024 px、最大2 MBのPNG画像が使えます。自動UVを有効にすると、各パーツに近い色の画像領域を割り当てます。無効にすると、アトラスを順番にサンプリングします。未加工時は元のPNGを保持します。グラデーション・塗りを使う場合は色を新しいPNGに焼き込みます。",
  },
  {
    question: "浮遊物とアニメーションはどう使えますか？",
    answer:
      "浮遊物にクリスタル・軌道・欠片を選べば、モデルの先端周りに追加構造体が並びます。エフェクトはグロー・キラキラ・マジックに加え、火の粉・氷晶・深淵・血晶・雷光・ルーンを選べます。点光源と粒子はアプリ内演出です。浮遊物のアニメーションは浮遊・回転・揺れ・脈動・公転で、アプリ内のプレビューと .bbmodel 書き出しに反映されます。Minecraftのリソースパックは静止モデルとして出力されます。",
  },
  {
    question: "強化段階・限界突破・形態変化・一時モードとは？",
    answer:
      "「強化・変化・モーション」で、同じ武器の +0〜+5 の強化段階、翼と金装飾の限界突破版、鎖で縛った封印形態／刃が伸びる解放形態、結晶が発光するオーバードライブ（一時モード）を作れます。プレビューの ⚡ ボタンで一時モードを4秒間発動できます。「バリアント」タブでは、段階強化・形態・モード・同テーマ全武器種を一覧生成し、クリックで編集に読み込めます。",
  },
  {
    question: "攻撃・魔法の発動モーションは？",
    answer:
      "斬撃・刺突・詠唱・変形・射撃・リロード・弓引き・召喚・儀式・振り下ろし・チェーン駆動など13種類。握り位置を支点に武器全体が動き、プレビュー下部のタイムラインで再生・一時停止・スクラブできます。.bbmodel には同じキーフレームのアニメーションとして書き出されます。スキルプリセットで浮遊物・エフェクト・形態とまとめて設定できます。",
  },
  {
    question: "バリアントをゲーム内で切り替えるには？",
    answer:
      "エクスポートの「バリアント一式」は、各バリアントを Custom Model Data（1.21.4 の range_dispatch）で切り替えるリソースパックです。/give @p minecraft:diamond_sword[minecraft:custom_model_data={floats:[3f]}] のように番号で呼び出せます。強化や一時モードの切り替えはデータパックやプラグインで custom_model_data を書き換えて実現します。Minecraft のアイテムモデル自体は動かないため、アニメーションは Blockbench で利用してください。",
  },
  {
    question: "パーツ編集とグラデーションは？",
    answer:
      "右の「仕上げ」で縦・横・斜め・放射のグラデーション、色、強さ、段階数、ミックス／乗算を選び、プレビューで適用します。結晶・翼・光輪・鎖・ルーン・ギア・スコープ・銃剣・魔法陣・棘は後付け可能。「パーツ編集」で3Dをクリックして位置・サイズ・色・発光・表示を変更、複製や追加もできます。Ctrl/Cmd+Zで戻し、Shift+Zでやり直し。再生成・保存・書き出しでも編集を保持します。",
  },
  {
    question: "Minecraftで使うには？",
    answer:
      "Minecraft Java Edition 1.21.4向けリソースパックをダウンロードし、resourcepacksフォルダに入れて有効にします。剣・ツルハシ・斧は対応するダイヤモンド製アイテム、杖は棒、盾とブロックは表示用として紙を置き換えます。各テンプレートの置き換えアイテムはエクスポート画面に表示されます。ゲーム内の性能・武器の挙動は変わりません。アニメーションと点光源・粒子はバニラの静止アイテムモデルでは再生されません。他バージョンやBedrock向けにはBlockbenchで変換してください。",
  },
];

const SHORTCUTS = [
  { key: "R", label: "ビューをリセット" },
  { key: "G", label: "グリッド" },
  { key: "W", label: "ワイヤー" },
  { key: "F", label: "拡大" },
];

export default function HelpModal() {
  const { closeModal } = useStudioStore();

  return (
    <Modal
      title="小さなピクセルから、はじめよう。"
      eyebrow="VOXELFORGE QUICK START"
      onClose={closeModal}
      wide
    >
      <p className="modal-description">
        3つのステップで、Minecraftの世界にあなたの作品を。
      </p>

      <div className="guide-steps">
        {STEPS.map((step, index) => (
          <div key={step.title}>
            <span className="guide-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <step.icon size={27} />
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>

      <div className="guide-details">
        {FAQ.map((entry) => (
          <details key={entry.question} open={entry.open}>
            <summary>
              {entry.question}
              <ChevronDown size={14} />
            </summary>
            <p>{entry.answer}</p>
          </details>
        ))}
      </div>

      <div className="keyboard-shortcuts">
        <span>ショートカット</span>
        {SHORTCUTS.map((shortcut) => (
          <span key={shortcut.key}>
            <kbd>{shortcut.key}</kbd>
            {shortcut.label}
          </span>
        ))}
      </div>

      <div className="modal-actions">
        <a
          href="https://web.blockbench.net/"
          target="_blank"
          rel="noreferrer"
          className="text-button"
        >
          Blockbenchを開く
          <ArrowUpRight size={14} />
        </a>
        <button className="primary-button" onClick={closeModal}>
          さあ、つくろう
          <ArrowRight size={14} />
        </button>
      </div>
    </Modal>
  );
}
