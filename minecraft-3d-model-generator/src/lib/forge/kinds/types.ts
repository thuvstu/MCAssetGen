import type { Builder } from "../builder";
import type { Params } from "../types";
import type { Rng } from "../util";

export interface RangeDef {
  label: string;
  min: number;
  max: number;
  def: number;
}

export interface KindDef {
  id: string;
  no: string;
  name: string;
  en: string;
  family: "武器" | "機巧" | "凶刃" | "防具" | "魔導" | "装飾";
  note: string;
  styles: { label: string; sub: string }[];
  length: RangeDef;
  width: RangeDef;
  palette: string;
  build: (b: Builder, p: Params, r: Rng) => void;
}
