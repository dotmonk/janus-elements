import type {
  KitProps,
} from "./props.d.ts";

export type DateRangeValue = {
  start?: string;
  end?: string;
};

export type DateRangePickerProps = Omit<KitProps, "onChange"> & {
  value?: DateRangeValue;
  name?: string;
  placeholder?: string;
  locale?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  instructionLabel?: string;
  instructionLabelWithStart?: string;
  onChange?: (value: DateRangeValue) => void;
};

export {};
