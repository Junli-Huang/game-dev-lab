import type { GenerationCell } from "./grid";
import type { Direction, TileType } from "./tiles";

export type CompatibilityRules = Record<TileType, Record<Direction, TileType[]>>;

const gradualNeighbors: Record<TileType, TileType[]> = {
  water: ["water", "sand"],
  sand: ["water", "sand", "grass"],
  grass: ["sand", "grass", "forest"],
  forest: ["grass", "forest"],
};

// Rules are explicit per direction even though this first teaching set is
// symmetric. Real tile sockets commonly differ on each edge.
export const compatibilityRules: CompatibilityRules = {
  water: { up: gradualNeighbors.water, right: gradualNeighbors.water, down: gradualNeighbors.water, left: gradualNeighbors.water },
  sand: { up: gradualNeighbors.sand, right: gradualNeighbors.sand, down: gradualNeighbors.sand, left: gradualNeighbors.sand },
  grass: { up: gradualNeighbors.grass, right: gradualNeighbors.grass, down: gradualNeighbors.grass, left: gradualNeighbors.grass },
  forest: { up: gradualNeighbors.forest, right: gradualNeighbors.forest, down: gradualNeighbors.forest, left: gradualNeighbors.forest },
};

export function reviseCandidates(
  source: GenerationCell,
  neighbor: GenerationCell,
  direction: Direction,
) {
  const revised = neighbor.candidates.filter((neighborTile) =>
    source.candidates.some((sourceTile) => compatibilityRules[sourceTile][direction].includes(neighborTile)),
  );
  if (revised.length === neighbor.candidates.length) {
    return false;
  }
  neighbor.candidates = revised;
  return true;
}
