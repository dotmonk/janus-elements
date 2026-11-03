import type {
  KitProps,
} from "./props.d.ts";

export type RichTextareaProps = Omit<KitProps, "onChange"> & {
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

export {};
