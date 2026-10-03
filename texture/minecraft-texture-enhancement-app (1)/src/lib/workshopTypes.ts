import type { Layer } from './effects';
import type { PartLayer } from './weaponParts';

export interface KeyPose {
  id: string;
  time: number;
  label: string;
  angle: number;
  x: number;
  y: number;
  scale: number;
}

export interface WorkshopState {
  parts: PartLayer[];
  effects: Layer[];
  motion: string;
  keyframes: KeyPose[];
  frameCount: number;
  motionEnabled: boolean;
}

export function defaultWorkshopState(): WorkshopState {
  const keys = [
    [0, '構え', 0, 0, 0, 0.76],
    [0.2, '振りかぶり', -43, -1, 1, 0.76],
    [0.4, '加速', -26, -1, 0, 0.76],
    [0.58, '一閃', 32, 2, -1, 0.76],
    [0.78, '止め', 24, 1, 0, 0.76],
    [1, '構え', 0, 0, 0, 0.76],
  ] as const;
  return {
    parts: [],
    effects: [],
    motion: 'slash',
    keyframes: keys.map(([time, label, angle, x, y, scale], index) => ({ id: `pose-default-${index}`, time, label, angle, x, y, scale })),
    frameCount: 8,
    motionEnabled: true,
  };
}