import type {
  JanusStyle,
} from "../index.js";

export function ensureThemeTokens(): void;

declare const theme: {
  tone(color?: string | null): string;
  mix(color: string, percent: number, withColor?: string): string;
  field(color?: string | null): JanusStyle;
  choiceLabel(disabled?: boolean): JanusStyle;
  choiceControl(tone: string): JanusStyle;
  dismissButton: JanusStyle;
  ensureThemeTokens: typeof ensureThemeTokens;
};

export default theme;
