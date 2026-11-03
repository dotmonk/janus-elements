import type {
  KitProps,
} from "./props.d.ts";

export type CheckboxProps = KitProps & {
  checked?: boolean;
  name?: string;
  value?: string;
};

export {};
