export const MATERIAL_IDS = ['air', 'sand', 'water', 'wood', 'fire'] as const;
export type MaterialId = typeof MATERIAL_IDS[number];
export const MATERIALS: Record<MaterialId, { color: string; behavior: string }> = {
  air: { color: '#0b1425', behavior: 'empty' }, sand: { color: '#e7bd65', behavior: 'powder' },
  water: { color: '#4a9fea', behavior: 'liquid' }, wood: { color: '#99683e', behavior: 'solid' },
  fire: { color: '#ff743d', behavior: 'fire' },
};
export const FIRE_RULES = { minLife: 30, maxLife: 90, ignitionProbability: .12 } as const;
export const DIRECTIONS = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], downLeft: [-1, 1], downRight: [1, 1],
} as const;
export type Direction = keyof typeof DIRECTIONS;
