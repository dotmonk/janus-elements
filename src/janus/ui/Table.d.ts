import type {
  KitProps,
} from "./props.d.ts";

export type TableColumn = {
  key: string;
  title?: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: Record<string, unknown>) => unknown;
};

export type TableProps = KitProps & {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  caption?: string;
  /** Viewport height (number = px). Default 320. */
  height?: number | string;
  /** Fixed body row height in px. Default 40. */
  rowHeight?: number | string;
  /** Extra rows rendered above/below the viewport. Default 5. */
  overscan?: number;
};

export {};
