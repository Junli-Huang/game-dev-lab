import { World } from './world';
import type { MaterialId } from './materials';
export const PRESET_IDS = ['empty', 'sandPile', 'waterTank', 'surfaceLevel', 'fireTest', 'mixed'] as const;
export type PresetId = typeof PRESET_IDS[number];
export function createPreset(id: PresetId, seed: number): World {
  const world = new World(120, 80, seed);
  const rect = (x: number, y: number, width: number, height: number, material: MaterialId) => {
    for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) world.set(x + dx, y + dy, material);
  };
  const tank = () => { rect(62, 40, 2, 36, 'wood'); rect(111, 40, 2, 36, 'wood'); rect(62, 74, 51, 2, 'wood'); rect(78, 20, 20, 14, 'water'); };
  if (id === 'sandPile' || id === 'mixed') { rect(24, 5, 16, 22, 'sand'); rect(10, 72, 45, 2, 'wood'); }
  if (id === 'waterTank' || id === 'mixed') tank();
  if (id === 'fireTest') { rect(35, 24, 50, 30, 'wood'); world.set(60, 39, 'fire', 90); }
  if (id === 'mixed') { rect(8, 43, 15, 12, 'wood'); world.set(15, 49, 'fire', 90); }
  if (id === 'surfaceLevel') {
    rect(42, 57, 35, 1, 'wood'); rect(42, 52, 1, 5, 'wood'); rect(76, 52, 1, 5, 'wood');
    rect(43, 56, 33, 1, 'water'); rect(47, 55, 25, 1, 'water'); world.set(59, 54, 'water');
  }
  return world;
}
