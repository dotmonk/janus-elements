import type {
  KitProps,
} from "./props.d.ts";
import type {
  HighlightLanguageId,
} from "./highlight.d.ts";

export type CodeEditorProps = Omit<KitProps, "onChange"> & {
  value?: string;
  name?: string;
  rows?: number;
  placeholder?: string;
  readOnly?: boolean;
  /** When set (and recognized), overrides filename/content detection. */
  language?: HighlightLanguageId | string;
  /** Used for extension-based language detection when `language` is unset. */
  filename?: string;
  onChange?: (value: string) => void;
  /** Fires when the resolved language changes (including first resolve). */
  onLanguageChange?: (language: HighlightLanguageId) => void;
};

export {};
