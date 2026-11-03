import type {
  KitProps,
} from "./props.d.ts";

export type TimePickerProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  placeholder?: string;
  locale?: string;
  step?: number;
  hour12?: boolean;
  clearable?: boolean;
  onChange?: (value: string | undefined) => void;
};

export {};
