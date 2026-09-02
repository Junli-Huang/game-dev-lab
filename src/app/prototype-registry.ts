import type { PrototypeDefinition, PrototypeMetadata } from "./types";
import { bouncingBall } from "../prototypes/bouncing-ball";
import { verletRope } from "../prototypes/verlet-rope";

export const prototypes: PrototypeDefinition[] = [verletRope, bouncingBall];

export function findPrototype(id: string) { return prototypes.find((item) => item.metadata.id === id); }
export function searchPrototypes(query: string, category = "All"): PrototypeMetadata[] {
  const needle = query.trim().toLowerCase();
  return prototypes.map((item) => item.metadata).filter((item) => {
    const categoryMatches = category === "All" || item.category === category;
    const text = [item.title, item.description, ...item.tags].join(" ").toLowerCase();
    return categoryMatches && (!needle || text.includes(needle));
  });
}
