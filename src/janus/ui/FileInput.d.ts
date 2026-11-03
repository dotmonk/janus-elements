import type {
  KitProps,
} from "./props.d.ts";

export type FileInputProps = Omit<KitProps, "onChange"> & {
  name?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
};

export {};
