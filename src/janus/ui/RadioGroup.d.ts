import type {
  KitProps,
} from "./props.d.ts";

export type RadioOption = {
  value: string;
  label?: string;
};

export type RadioGroupProps = KitProps & {
  name?: string;
  value?: string;
  options?: RadioOption[];
  label?: string;
};

export {};
