import type {
  KitProps,
} from "./props.d.ts";

export type TextareaProps = KitProps & {
  value?: string;
  name?: string;
  rows?: number;
  placeholder?: string;
};

export {};
