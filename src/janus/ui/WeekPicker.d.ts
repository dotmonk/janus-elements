import type {
  KitProps,
} from "./props.d.ts";

export type WeekPickerProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  placeholder?: string;
  locale?: string;
  clearable?: boolean;
  weekColumnLabel?: string;
  weekRowLabel?: string;
  weekValueLabel?: string;
  onChange?: (value: string | undefined) => void;
};

export {};
