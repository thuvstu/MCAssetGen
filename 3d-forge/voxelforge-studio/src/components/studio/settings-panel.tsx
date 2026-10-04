"use client";
import {
  ArrowRight,
  Box,
  Gem,
  LoaderCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import GeneratorSettings from "./generator-settings";
import FinishingPanel from "./finishing-panel";
import PartsEditor from "./parts-editor";
import { useStudioStore, type InspectorTab } from "./studio-context";
const TABS: { id: InspectorTab; label: string; icon: typeof Box }[] = [
  { id: "generator", label: "生成", icon: SlidersHorizontal },
  { id: "finish", label: "仕上げ", icon: Gem },
  { id: "edit", label: "パーツ編集", icon: Box },
];
export default function SettingsPanel() {
  const { studio, inspectorTab, setInspectorTab } = useStudioStore();
  return (
    <aside className="settings-panel" aria-label="生成設定">
      <div className="settings-heading">
        <div className="settings-title">
          <span>
            <SlidersHorizontal size={17} />
          </span>
          <h2>制作ツール</h2>
          <span className="settings-version">STUDIO 2.0</span>
        </div>
        <p>形・色・パーツ。ひとつずつ、理想へ。</p>
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="制作ツール">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={inspectorTab === t.id ? "active" : ""}
            aria-selected={inspectorTab === t.id}
            onClick={() => setInspectorTab(t.id)}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="settings-scroll">
        <fieldset className="inspector-fieldset" disabled={studio.busy}>
          {inspectorTab === "generator" && <GeneratorSettings />}
          {inspectorTab === "finish" && <FinishingPanel />}
          {inspectorTab === "edit" && <PartsEditor />}
        </fieldset>
      </div>
      <div className="settings-footer">
        <button
          className="generate-button"
          disabled={studio.busy}
          onClick={studio.generate}
        >
          {studio.busy ? (
            <LoaderCircle className="spinning" size={17} />
          ) : (
            <Sparkles size={17} />
          )}
          <span>{studio.busy ? "モデルを生成中…" : "モデルを生成"}</span>
          {!studio.busy && <ArrowRight size={16} />}
        </button>
        <p>
          <Zap size={11} />
          <span>生成・編集内容を保存</span>
          <i />
          <span>クレジット不要</span>
        </p>
        <div className="generation-safe-note">
          <ShieldCheck size={12} />
          テクスチャと編集も一緒に書き出し
        </div>
      </div>
    </aside>
  );
}
