import type {
  KitProps,
} from "./props.d.ts";

export type RangeInputProps = Omit<KitProps, "onChange"> & {
  value?: number;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
};

export {};
