import type {
  KitProps,
} from "./props.d.ts";
import type {
  IconComponent,
} from "./icon.d.ts";

export type InputProps = KitProps & {
  value?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  headIcon?: IconComponent | null;
  tailIcon?: IconComponent | null;
};

export {};
