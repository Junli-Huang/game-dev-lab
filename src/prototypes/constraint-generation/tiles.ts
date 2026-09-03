export type TileType = "water" | "sand" | "grass" | "forest";

export type Direction = "up" | "right" | "down" | "left";

export interface TileDefinition {
  id: TileType;
  label: string;
  shortLabel: string;
  color: string;
  accent: string;
}

export const tileTypes: TileType[] = ["water", "sand", "grass", "forest"];

export const tiles: Record<TileType, TileDefinition> = {
  water: { id: "water", label: "Water", shortLabel: "W", color: "#246a8d", accent: "#7cd7ff" },
  sand: { id: "sand", label: "Sand", shortLabel: "S", color: "#a98245", accent: "#ffe09a" },
  grass: { id: "grass", label: "Grass", shortLabel: "G", color: "#3c7757", accent: "#92efae" },
  forest: { id: "forest", label: "Forest", shortLabel: "F", color: "#244d43", accent: "#63c69f" },
};

export const directions: Array<{ id: Direction; dx: number; dy: number; opposite: Direction }> = [
  { id: "up", dx: 0, dy: -1, opposite: "down" },
  { id: "right", dx: 1, dy: 0, opposite: "left" },
  { id: "down", dx: 0, dy: 1, opposite: "up" },
  { id: "left", dx: -1, dy: 0, opposite: "right" },
];
