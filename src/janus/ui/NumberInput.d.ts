import type {
  KitProps,
} from "./props.d.ts";

export type NumberInputProps = Omit<KitProps, "onChange"> & {
  value?: number;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onChange?: (value: number | undefined) => void;
};

export {};
