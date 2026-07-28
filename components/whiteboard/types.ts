export type Tool =
  | "pen"
  | "eraser"
  | "line"
  | "rectangle"
  | "circle"
  | "arrow"
  | "highlighter"
  | "laser"
  | "pan"
  | "text"
  | "triangle"
  | "polygon";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
  text?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  fontSize?: number;
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