import type {
  KitProps,
} from "./props.d.ts";

export type CharactersIconProps = KitProps & {
  text?: string | number;
  size?: number;
  animated?: boolean;
  "aria-label"?: string;
};

export {};
