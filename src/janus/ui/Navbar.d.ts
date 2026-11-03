import type {
  KitProps,
} from "./props.d.ts";

export type NavbarProps = KitProps & {
  value?: string;
  titles?: string[];
  size?: string | number;
  label?: string;
};

export {};
