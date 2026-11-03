import type {
  JanusStyle,
} from "../index.js";

export type KitTone =
  | "standard"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | (string & {});

export type KitProps = {
  style?: JanusStyle;
  color?: KitTone | null;
  disabled?: boolean;
  class?: string;
  className?: string;
  id?: string;
  title?: string;
  onClick?: (event: Event) => void;
  onChange?: (event: Event) => void;
  onClose?: (event: Event) => void;
  children?: unknown;
};
