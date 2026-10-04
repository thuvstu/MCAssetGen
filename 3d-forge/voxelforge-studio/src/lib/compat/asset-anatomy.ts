import { ModelElement, Vector3 } from "./asset-types";

/** Rough structural read of a weapon: where the guard is, how tall and wide the "upper" part is. */
export interface ModelAnatomy {
  minY: number;
  maxY: number;
  height: number;
  threshold: number;
  guardY: number;
  guardHalfWidth: number;
  guardHalfDepth: number;
  upperHalfWidth: number;
  upperHalfDepth: number;
}

const FALLBACK: ModelAnatomy = {
  minY: 0,
  maxY: 16,
  height: 16,
  threshold: 6,
  guardY: 4,
  guardHalfWidth: 2,
  guardHalfDepth: 1,
  upperHalfWidth: 1,
  upperHalfDepth: 1,
};

export function elementCenter(element: ModelElement): Vector3 {
  return [(element.from[0] + element.to[0]) / 2, (element.from[1] + element.to[1]) / 2, (element.from[2] + element.to[2]) / 2];
}

export function analyzeModel(elements: ModelElement[]): ModelAnatomy {
  const visible = elements.filter((element) => element.visible !== false && !element.generated);
  if (visible.length === 0) return FALLBACK;

  const minY = Math.min(...visible.map((element) => Math.min(element.from[1], element.to[1])));
  const maxY = Math.max(...visible.map((element) => Math.max(element.from[1], element.to[1])));
  const height = Math.max(1, maxY - minY);
  const threshold = minY + height * 0.42;

  const widest = visible.reduce((best, element) => (Math.abs(element.to[0] - element.from[0]) > Math.abs(best.to[0] - best.from[0]) ? element : best));
  const upper = visible.filter((element) => elementCenter(element)[1] > threshold);
  const upperHalfWidth = upper.length ? Math.max(...upper.map((element) => Math.max(Math.abs(element.from[0]), Math.abs(element.to[0])))) : 1;
  const upperHalfDepth = upper.length ? Math.max(...upper.map((element) => Math.max(Math.abs(element.from[2]), Math.abs(element.to[2])))) : 1;

  return {
    minY,
    maxY,
    height,
    threshold,
    guardY: elementCenter(widest)[1],
    guardHalfWidth: Math.min(8, Math.abs(widest.to[0] - widest.from[0]) / 2),
    guardHalfDepth: Math.min(6, Math.abs(widest.to[2] - widest.from[2]) / 2),
    upperHalfWidth: Math.min(upperHalfWidth, 6),
    upperHalfDepth: Math.min(upperHalfDepth, 4),
  };
}
