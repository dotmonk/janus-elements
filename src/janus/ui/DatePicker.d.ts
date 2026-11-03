import type {
  KitProps,
} from "./props.d.ts";

export type DatePickerProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  placeholder?: string;
  locale?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  onChange?: (value: string | undefined) => void;
};

export {};
