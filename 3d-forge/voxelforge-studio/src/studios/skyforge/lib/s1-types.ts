// Shared sampler/ramps types for the S1 (Vite forge) ports.
// Originally from the S1 generator engine; kept minimal so the ported
// forms/design/layers/blueprints modules compile standalone.
export type Sampler = (x: number, y: number) => string | null;
export interface Ramps { metal: string[]; accent: string[]; grip: string[]; gem: string[] }
