import type {
  KitProps,
} from "./props.d.ts";

export type ProgressProps = KitProps & {
  value?: number;
  max?: number;
  label?: string;
};

export {};
