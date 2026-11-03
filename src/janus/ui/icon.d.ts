import type {
  KitProps,
} from "./props.d.ts";

export type IconProps = KitProps & {
  size?: number;
  animated?: boolean;
  title?: string;
  "aria-label"?: string;
};

export type IconComponent = new () => HTMLElement;

declare const Icon: IconComponent;
export default Icon;
