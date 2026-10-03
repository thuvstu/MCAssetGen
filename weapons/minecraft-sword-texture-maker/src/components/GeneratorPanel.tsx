import { useState } from "react";
import { GROUP_IDS, GROUPS, THEMES } from "../generator/catalog";
import type { GroupId, Recipe } from "../generator/catalog";
import { analyzeDesign, summarizeGroup } from "../generator/generate";
import type { GenerationReport } from "../generator/generate";
import type { SwordOptions } from "../engine/types";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

const groupIcons: Record<GroupId, IconName> = { blade: "sword", guard: "shield", grip: "grip", palette: "palette", element: "spark", attachments: "crystal", finish: "finish", effects: "layers" };

type Props = {
  options: SwordOptions; recipe: Recipe; onChange: (recipe: Recipe) => void;
  onGenerate: (scope?: GroupId[], count?: number) => void; onReset: () => void;
  busy: boolean; report: GenerationReport | null;
  fixedSeed: boolean; onFixedSeed: (value: boolean) => void;
  seedInput: string; onSeedInput: (value: string) => void; seedValid: boolean;
};

export default function GeneratorPanel({ options, recipe, onChange, onGenerate, onReset, busy, report, fixedSeed, onFixedSeed, seedInput, onSeedInput, seedValid }: Props) {
  const [checkMessage, setCheckMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const lockedCount = GROUP_IDS.filter((id) => recipe.groups[id].mode === "keep").length;
  const specifiedCount = GROUP_IDS.filter((id) => recipe.groups[id].mode === "pick").length;
  const allLocked = lockedCount === GROUP_IDS.length;
  const issues = analyzeDesign(options);
  const changeGroup = (id: GroupId, value: "auto" | "keep" | string) => {
    const current = recipe.groups[id];
    const next = value === "keep" ? { ...current, mode: current.mode === "keep" ? "auto" as const : "keep" as const } :
      value === "auto" ? { ...current, mode: "auto" as const } : { mode: "pick" as const, value };
    onChange({ ...recipe, groups: { ...recipe.groups, [id]: next } });
  };
  const lockAll = () => onChange({ ...recipe, groups: Object.fromEntries(GROUP_IDS.map((id) => [id, { ...recipe.groups[id], mode: allLocked ? "auto" : "keep" }])) as Recipe["groups"] });
  const runChecks = async () => {
    setChecking(true);
    try {
      const { runGeneratorChecks } = await import("../generator/checks");
      const results = runGeneratorChecks();
      const failed = results.filter((r) => !r.passed);
      setCheckMessage(failed.length ? `${failed.length}件の検証に失敗: ${failed.map((r) => `${r.name}: ${r.error}`).join(" / ")}` : `${results.length}項目を検証しました。固定・指定・再現性・履歴のチェックに合格。`);
    } catch (error) { setCheckMessage(error instanceof Error ? error.message : "検証を実行できませんでした。"); }
    finally { setChecking(false); }
  };

  return (
    <section className="generator-panel panel-enter" aria-labelledby="generator-heading">
      <div className="generator-heading">
        <div><span className="eyebrow">GUIDED RANDOMIZATION</span><h2 id="generator-heading">残すところは、あなたが決める。</h2></div>
        <span className="engine-mark" title="相性ルール付き生成"><Icon name="spark" size={20} /></span>
      </div>
      <p className="generator-description">固定はそのまま。指定はその種類で。残りは、相性を見て。</p>

      <div className="recipe-settings">
        <label className="recipe-theme"><span>デザインの方向性</span>
          <select value={recipe.theme} onChange={(e) => onChange({ ...recipe, theme: e.target.value as Recipe["theme"] })}>
            <option value="auto">おまかせ / 調和を優先</option>
            {THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}
          </select>
        </label>
        <fieldset className="density-control"><legend>装飾の密度</legend>
          <div>{([{ id: "quiet", label: "控えめ" }, { id: "balanced", label: "バランス" }, { id: "ornate", label: "華やか" }] as const).map((d) =>
            <button key={d.id} type="button" aria-pressed={recipe.density === d.id} className={recipe.density === d.id ? "selected" : ""} onClick={() => onChange({ ...recipe, density: d.id })}>{d.label}</button>)}</div>
        </fieldset>
      </div>

      <div className="part-list-heading"><span>パーツごとのルール</span><button onClick={lockAll}><Icon name={allLocked ? "unlock" : "lock"} size={12} />{allLocked ? "すべて解除" : "すべて固定"}</button></div>
      <div className="generation-parts">
        {GROUP_IDS.map((id) => {
          const group = GROUPS[id]; const rule = recipe.groups[id]; const kept = rule.mode === "keep";
          return (
            <div className={`generation-row ${kept ? "is-locked" : ""} ${rule.mode === "pick" ? "is-specified" : ""}`} key={id}>
              <div className="part-label"><Icon name={groupIcons[id]} size={17} /><div><label htmlFor={`rule-${id}`}>{group.label}</label>
                <span className="part-current">{summarizeGroup(options, id)}</span></div></div>
              <div className="part-selection">
                {id === "palette" && <span className="mini-palette" aria-hidden="true">{[options.palette.blade, options.palette.guard, options.palette.handle].map((color, i) => <i key={i} style={{ background: color }} />)}</span>}
                <select id={`rule-${id}`} value={kept ? "keep" : rule.mode === "pick" ? rule.value : "auto"} disabled={kept} onChange={(e) => changeGroup(id, e.target.value)}>
                  <option value="auto">おまかせ</option>
                  {kept && <option value="keep">現在の設定を固定</option>}
                  {group.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
                </select>
              </div>
              <button type="button" className={`part-lock ${kept ? "active" : ""}`} onClick={() => changeGroup(id, "keep")} aria-pressed={kept} aria-label={`${group.label}の固定${kept ? "を解除" : "を有効化"}`} title={kept ? `${group.label}の固定を解除` : group.description}><Icon name={kept ? "lock" : "unlock"} size={15} /></button>
              <button type="button" className="part-reroll" disabled={kept || busy || !seedValid} onClick={() => onGenerate([id])} aria-label={`${group.label}だけを再生成`} title={`${group.label}だけを再生成`}><Icon name="shuffle" size={14} /></button>
            </div>
          );
        })}
      </div>

      <div className="rule-footnote"><span><Icon name="lock" size={12} />{lockedCount} 固定 <span className="rule-divider">/</span> {specifiedCount} 指定</span><button onClick={onReset}><Icon name="reset" size={12} />リセット</button></div>
      <p className="rule-explanation">指定は種類を維持、固定は数値・細部も維持。ルールは次の生成に適用されます。</p>

      <div className="generate-actions">
        <button className="primary-button generate-button" disabled={busy || allLocked || !seedValid} onClick={() => onGenerate()}><Icon name="shuffle" className={busy ? "working-icon" : ""} size={19} />{busy ? "組み合わせを生成中" : allLocked ? "全パーツを固定中" : "未固定のパーツを生成"}<kbd>R</kbd></button>
        <button className="secondary-button compare-button" disabled={busy || allLocked || !seedValid} onClick={() => onGenerate(undefined, 4)}><Icon name="compare" size={17} />4案を比較</button>
      </div>
      {allLocked ? <p className="all-locked-note">変えたいパーツの鍵を解除してください。現在のデザインは変更しません。</p> : <p className="generation-assurance"><Icon name="shield" size={12} />固定・指定を優先。相性の調整は、おまかせの部分だけ。</p>}

      <details className="generation-details"><summary><Icon name="chevron" size={13} /><span>シードと生成メモ</span><code>#{options.seed}</code></summary>
        <div className="generation-details-body">
          <label className="seed-toggle"><input type="checkbox" checked={fixedSeed} onChange={(e) => { onFixedSeed(e.target.checked); if (!seedInput) onSeedInput(String(options.seed)); }} />シードを指定して再現する</label>
          {fixedSeed && <label className="seed-field"><span>Seed</span><input type="text" inputMode="numeric" value={seedInput} onChange={(e) => onSeedInput(e.target.value)} aria-invalid={!seedValid} placeholder="0 - 4294967295" /></label>}
          {!seedValid && <p className="inline-error">0から4294967295までの整数を入力してください。</p>}
          <p className="details-note">同じシード・ルール・固定値なら同じ結果になります。固定はランダム生成にのみ適用され、手動編集やプリセット選択は制限しません。</p>
          {report && <ul className="generation-notes">{report.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
          <button className="text-action check-rules-button" onClick={runChecks} disabled={checking}>{checking ? "検証中..." : "生成ルールのセルフチェック"}<Icon name="chevron" size={12} /></button>
          {checkMessage && <p className="details-note" role="status">{checkMessage}</p>}
        </div>
      </details>

      {issues.length > 0 && <details className="compatibility-note"><summary><Icon name="warning" size={14} />構成のヒント ({issues.length})<Icon name="chevron" size={12} /></summary><ul>{issues.map((issue) => <li key={issue.id}>{issue.message}</li>)}</ul><p>指定や固定を勝手に解除することはありません。</p></details>}
    </section>
  );
}