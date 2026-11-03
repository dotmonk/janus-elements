import type {
  KitProps,
} from "./props.d.ts";

export type ColorInputProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  onChange?: (value: string) => void;
};

export {};
