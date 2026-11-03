import type {
  KitProps,
} from "./props.d.ts";

export type ToolbarProps = KitProps & {
  label?: string;
  orientation?: "horizontal" | "vertical";
};

export {};
