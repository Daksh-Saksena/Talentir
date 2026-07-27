export type Tool =
  | "pen"
  | "eraser"
  | "line"
  | "rectangle"
  | "circle"
  | "arrow"
  | "highlighter"
  | "laser"
  | "pan";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
}

export interface WhiteboardSettings {
  tool: Tool;
  color: string;
  penSize: number;
}

export interface MagicSettings {
  ocr: boolean;
  beautify: boolean;
  smartSuggestions: boolean;
  equationDetection: boolean;
  chemistryDetection: boolean;
  shapeDetection: boolean;
}