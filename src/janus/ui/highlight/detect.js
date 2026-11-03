import {
  resolveLanguageId,
} from "./aliases.js";

const EXTENSION_MAP = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  html: "html",
  htm: "html",
  xml: "xml",
  svg: "xml",
  css: "css",
  json: "json",
  csv: "csv",
  md: "markdown",
  markdown: "markdown",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  pl: "perl",
  pm: "perl",
  py: "python",
  pyw: "python",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hh: "cpp",
  java: "java",
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  diff: "diff",
  patch: "diff",
  rs: "rust",
  go: "go",
};

const extensionFromFilename = (filename) => {
  if (!filename) {
    return null;
  }
  const base = String(filename).split(/[/\\]/).pop() || "";
  const dot = base.lastIndexOf(".");
  if (
    dot <= 0 ||
    dot === base.length - 1
  ) {
    return null;
  }
  return base.slice(dot + 1).toLowerCase();
};

const shebangLanguage = (content) => {
  const first = String(content).split(
    /\r?\n/,
    1,
  )[0] || "";
  if (!first.startsWith("#!")) {
    return null;
  }
  const line = first.toLowerCase();
  if (/\b(python|python3|py)\b/.test(line)) {
    return "python";
  }
  if (/\b(node|nodejs)\b/.test(line)) {
    return "javascript";
  }
  if (/\b(bash|sh|zsh|dash|ksh)\b/.test(line)) {
    return "shell";
  }
  if (/\bperl\b/.test(line)) {
    return "perl";
  }
  return null;
};

const detectFromContent = (content) => {
  const text = String(content ?? "");
  if (!text.trim()) {
    return null;
  }

  const fromShebang = shebangLanguage(text);
  if (fromShebang) {
    return fromShebang;
  }

  const head = text.slice(
    0,
    4000,
  ).trimStart();

  if (/^<\?xml\b/i.test(head)) {
    return "xml";
  }
  if (
    /^<!DOCTYPE\s+html\b/i.test(head) ||
    /^<html[\s>]/i.test(head)
  ) {
    return "html";
  }
  if (
    /^diff --git\b/m.test(head) ||
    /^--- .+\n\+\+\+ /m.test(head)
  ) {
    return "diff";
  }
  if (
    /^#{1,6}\s+\S/m.test(head) &&
    (
      /```/.test(head) ||
      /\[[^\]]+\]\([^)]+\)/.test(head)
    )
  ) {
    return "markdown";
  }

  const jsonCandidate = head.replace(
    /^\uFEFF/,
    "",
  ).trim();
  if (
    (
      jsonCandidate.startsWith("{") ||
      jsonCandidate.startsWith("[")
    ) &&
    /"\s*:/.test(jsonCandidate)
  ) {
    try {
      JSON.parse(jsonCandidate);
      return "json";
    } catch {
      // not strict JSON; keep checking
    }
  }

  if (
    /^[ \t]*[\w.-]+\s*:\s*\S/m.test(head) &&
    !/[;{}]/.test(head.slice(
      0,
      200,
    )) &&
    !/\b(function|const|let|var|def|class)\b/.test(head)
  ) {
    return "yaml";
  }

  if (
    /\bSELECT\b[\s\S]*\bFROM\b/i.test(head) ||
    /\bINSERT\s+INTO\b/i.test(head) ||
    /\bCREATE\s+TABLE\b/i.test(head)
  ) {
    return "sql";
  }

  if (
    /\bfn\s+\w+\s*\(/.test(head) &&
    /\b(let|mut|impl|pub)\b/.test(head)
  ) {
    return "rust";
  }

  if (
    /\bpackage\s+\w+/.test(head) &&
    /\bfunc\s+\w+\s*\(/.test(head)
  ) {
    return "go";
  }

  if (
    /\b(def|import|from|class)\b/.test(head) &&
    (
      /:\s*$/m.test(head) ||
      /\bself\b/.test(head)
    )
  ) {
    return "python";
  }

  if (
    /\b(function|const|let|var|=>|import\s+.+from)\b/.test(head) ||
    /\bexport\s+(default|const|function|class)\b/.test(head)
  ) {
    if (/\b(interface|type\s+\w+\s*=|implements|readonly|satisfies)\b/.test(head)) {
      return "typescript";
    }
    return "javascript";
  }

  if (/<\/?[a-zA-Z][\w:-]*[\s>]/.test(head)) {
    return "html";
  }

  return null;
};

/**
 * @param {{ filename?: string, content?: string }} [options]
 * @returns {string} canonical language id
 */
export const detectLanguage = (options = {}) => {
  const {
    filename,
    content,
  } = options;
  const ext = extensionFromFilename(filename);
  if (
    ext &&
    EXTENSION_MAP[ext]
  ) {
    return EXTENSION_MAP[ext];
  }
  return detectFromContent(content) || "plain";
};

/**
 * Resolve the language used for highlighting.
 * Explicit `language` wins when it resolves; otherwise detect from filename/content.
 * @param {{ language?: string, filename?: string, content?: string }} options
 */
export const resolveHighlightLanguage = (options = {}) => {
  const fromProp = resolveLanguageId(options.language);
  if (fromProp) {
    return fromProp;
  }
  return detectLanguage(
    {
      filename: options.filename,
      content: options.content,
    },
  );
};
