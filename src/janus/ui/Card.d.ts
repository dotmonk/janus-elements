import type {
  KitProps,
} from "./props.d.ts";

export type CardProps = KitProps & {
  title?: string;
  subtitle?: string;
  footer?: unknown;
};

export {};
