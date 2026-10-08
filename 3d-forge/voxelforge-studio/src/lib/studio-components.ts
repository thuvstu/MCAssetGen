/**
 * GUI を取り込み済みのスタジオ id 一覧。
 *
 * 動的import本体は `@/components/studio/studio-host` (client) が持つが、
 * サーバーコンポーネントからも「移植済みか」を判定したいので、副作用の無い
 * この表を唯一の情報源にする。
 */
export const PORTED_GUI_IDS = [
  "texcraft",
  "sword",
  "spell",
  "arcane",
  "mob",
  "armor",
  "material",
  "structure",
  "sky2",
  "adv",
  // 複数ページ取り込み (実体は /studios/<id>/... の静的ルートが優先される)
  "mythicforge",
  "mythiccraft",
  "fabric",
  "skyforge",
] as const;

export function isPortedGui(id: string): boolean {
  return (PORTED_GUI_IDS as readonly string[]).includes(id);
}
