export type SdfOperation = "circle" | "box" | "union" | "intersection" | "subtract" | "smooth-union";
export type SdfView = "normal" | "distance" | "sign" | "contour";
export type ApplicationMode = "playground" | "ui-outline" | "spell-area" | "metaball" | "collision";
export interface Point2 { x: number; y: number }

export interface SdfState {
  circlePosition: Point2;
  boxPosition: Point2;
  playerPosition: Point2;
  circleRadius: number;
  boxHalfWidth: number;
  boxHalfHeight: number;
  outlineWidth: number;
  glowWidth: number;
  edgeSoftness: number;
  smoothness: number;
  operation: SdfOperation;
  view: SdfView;
  application: ApplicationMode;
}

export const defaultSdfState = (): SdfState => ({
  circlePosition: { x: -0.25, y: 0 },
  boxPosition: { x: 0.25, y: 0 },
  playerPosition: { x: 0.58, y: -0.22 },
  circleRadius: 0.28,
  boxHalfWidth: 0.25,
  boxHalfHeight: 0.18,
  outlineWidth: 0.015,
  glowWidth: 0.12,
  edgeSoftness: 0.008,
  smoothness: 0.12,
  operation: "union",
  view: "normal",
  application: "ui-outline",
});
