import type {
  KitProps,
} from "./props.d.ts";

export type DateTimePickerProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  placeholder?: string;
  locale?: string;
  min?: string;
  max?: string;
  hour12?: boolean;
  hourLabel?: string;
  minuteLabel?: string;
  clearable?: boolean;
  onChange?: (value: string | undefined) => void;
};

export {};
