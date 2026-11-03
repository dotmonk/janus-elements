export type HighlightLanguageId =
  | "plain"
  | "javascript"
  | "typescript"
  | "html"
  | "xml"
  | "css"
  | "json"
  | "csv"
  | "markdown"
  | "shell"
  | "perl"
  | "python"
  | "c"
  | "cpp"
  | "java"
  | "sql"
  | "yaml"
  | "diff"
  | "rust"
  | "go";

export declare const LANGUAGE_IDS: readonly HighlightLanguageId[];

export declare function resolveLanguageId(name: string | null | undefined): HighlightLanguageId | null;

export declare function detectLanguage(options?: {
  filename?: string;
  content?: string;
}): HighlightLanguageId;

export declare function resolveHighlightLanguage(options?: {
  language?: string;
  filename?: string;
  content?: string;
}): HighlightLanguageId;

export declare function highlight(code: string, language?: string): string;

export declare function escapeHtml(value: string): string;

export declare function ensureHighlightStyles(): void;

declare const highlightDefault: typeof highlight;
export default highlightDefault;
