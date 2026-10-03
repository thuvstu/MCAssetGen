import { EFFECTS, defaultParams } from './effects';
import { SAMPLES } from './samples';
import { RESOLUTIONS, fitTex } from './tex';
import { PART_LIBRARY, createPart, renderParts, renderWeaponFrame } from './weaponParts';
import { axis } from './geometry';

export interface CheckResult { effect: string; size: number; texture: string; passed: boolean; error?: string }

export async function checkCompatibility(onProgress: (done: number, total: number) => void, signal: AbortSignal): Promise<CheckResult[]> {
  const samples = ['diamond_ore', 'sword', 'inventory'].map((id) => SAMPLES.find((s) => s.id === id)!);
  const motions = ['idle', 'slash', 'combo', 'thrust', 'smash', 'spin', 'guard', 'cast'];
  const total = samples.length * RESOLUTIONS.length * EFFECTS.length + RESOLUTIONS.length * (PART_LIBRARY.length + motions.length * 8);
  const results: CheckResult[] = [];
  for (const size of RESOLUTIONS) for (const sample of samples) {
    const source = fitTex(sample.make(), size);
    for (const effect of EFFECTS) {
      if (signal.aborted) return results;
      const original = new Uint8ClampedArray(source.d);
      try {
        const output = effect.apply(source, defaultParams(effect), { seed: 43, t: 0.25 });
        if (output.w < 1 || output.h < 1 || Math.max(output.w, output.h) > 128 || output.d.length !== output.w * output.h * 4) throw new Error('出力寸法が不正です。');
        if (!original.every((v, i) => source.d[i] === v)) throw new Error('元画像が変更されました。');
        results.push({ effect: effect.name, size, texture: sample.name, passed: true });
      } catch (error) {
        results.push({ effect: effect.name, size, texture: sample.name, passed: false, error: error instanceof Error ? error.message : String(error) });
      }
      if (results.length % 8 === 0) { onProgress(results.length, total); await new Promise((resolve) => setTimeout(resolve, 0)); }
    }
  }
  const weapon = SAMPLES.find((s) => s.id === 'sword')!;
  for (const size of RESOLUTIONS) {
    const source = fitTex(weapon.make(), size);
    const original = new Uint8ClampedArray(source.d);
    for (let i = 0; i < PART_LIBRARY.length; i++) {
      if (signal.aborted) return results;
      const part = PART_LIBRARY[i];
      try {
        const output = renderParts(source, [createPart(part.type)], 0.25);
        if (output.w !== source.w || output.h !== source.h || output.d.length !== source.d.length) throw new Error('パーツの寸法が不正です。');
        if (!original.every((v, j) => source.d[j] === v)) throw new Error('元テクスチャが変更されました。');
        if (output.d.some((v) => Number.isNaN(v))) throw new Error('パーツに不正なピクセルがあります。');
        results.push({ effect: `パーツ: ${part.name}`, size, texture: weapon.name, passed: true });
      } catch (error) {
        results.push({ effect: `パーツ: ${part.name}`, size, texture: weapon.name, passed: false, error: error instanceof Error ? error.message : String(error) });
      }
      if (results.length % 8 === 0) { onProgress(results.length, total); await new Promise((resolve) => setTimeout(resolve, 0)); }
    }
    const byName = (id: string) => Math.sin(id.length * 11) * 38;
    const accents = '#a5f9e6';
    for (const motion of motions) for (let frame = 0; frame < 8; frame++) {
      if (signal.aborted) return results;
      try {
        const direction = axis(source);
        const output = renderWeaponFrame(source, [createPart('crossguard'), createPart('gem')], [], frame / 8,
          { angle: byName(motion) * Math.sin(frame / 8 * Math.PI * 2), x: Math.round(Math.sin(frame) * size / 16), y: Math.round(Math.cos(frame) * size / 16), scale: 0.76 }, motion, frame, accents);
        if (output.w !== source.w || output.h !== source.h || output.d.length !== source.d.length) throw new Error('アニメーションの寸法が不正です。');
        if (output.d.some((v) => Number.isNaN(v))) throw new Error('アニメーションに不正なピクセルがあります。');
        if (!(direction.ax >= -1 && direction.ax <= 1 && direction.ay >= -1 && direction.ay <= 1)) throw new Error('武器の軸を検出できません。');
        results.push({ effect: `アニメーション: ${motion} / ${frame + 1}`, size, texture: weapon.name, passed: true });
      } catch (error) {
        results.push({ effect: `アニメーション: ${motion} / ${frame + 1}`, size, texture: weapon.name, passed: false, error: error instanceof Error ? error.message : String(error) });
      }
      if (results.length % 8 === 0) { onProgress(results.length, total); await new Promise((resolve) => setTimeout(resolve, 0)); }
    }
  }
  onProgress(total, total);
  return results;
}