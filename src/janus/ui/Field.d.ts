import type {
  KitProps,
} from "./props.d.ts";

export type FieldProps = KitProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export {};
