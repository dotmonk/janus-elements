import type {
  KitProps,
} from "./props.d.ts";

export type BaseThemeProps = KitProps & {
  mode?: "system" | "light" | "dark";
};

export {};
