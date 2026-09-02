export type SdfOperation = "circle" | "box" | "union" | "intersection" | "subtract" | "smooth-union";
export type SdfView = "normal" | "distance" | "sign" | "contour";
export interface Point2 { x: number; y: number }

export interface SdfState {
  circlePosition: Point2;
  boxPosition: Point2;
  circleRadius: number;
  boxHalfWidth: number;
  boxHalfHeight: number;
  outlineWidth: number;
  glowWidth: number;
  edgeSoftness: number;
  smoothness: number;
  operation: SdfOperation;
  view: SdfView;
}

export const defaultSdfState = (): SdfState => ({
  circlePosition: { x: -0.25, y: 0 },
  boxPosition: { x: 0.25, y: 0 },
  circleRadius: 0.28,
  boxHalfWidth: 0.25,
  boxHalfHeight: 0.18,
  outlineWidth: 0.015,
  glowWidth: 0.12,
  edgeSoftness: 0.008,
  smoothness: 0.12,
  operation: "union",
  view: "distance",
});
