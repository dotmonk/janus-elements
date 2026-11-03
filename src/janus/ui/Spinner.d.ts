import type {
  KitProps,
} from "./props.d.ts";

export type SpinnerVariant =
  | "ring"
  | "dots"
  | "bars"
  | "pulse";

export type SpinnerProps = KitProps & {
  variant?: SpinnerVariant;
};

export {};
