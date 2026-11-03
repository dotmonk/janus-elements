import type {
  KitProps,
} from "./props.d.ts";
import type {
  IconComponent,
} from "./icon.d.ts";

export type ButtonProps = KitProps & {
  active?: boolean;
  href?: string;
  headIcon?: IconComponent | null;
  tailIcon?: IconComponent | null;
};

export {};
