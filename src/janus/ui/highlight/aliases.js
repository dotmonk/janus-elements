/** Canonical language ids supported by the highlighter. */
export const LANGUAGE_IDS = [
  "plain",
  "javascript",
  "typescript",
  "html",
  "xml",
  "css",
  "json",
  "csv",
  "markdown",
  "shell",
  "perl",
  "python",
  "c",
  "cpp",
  "java",
  "sql",
  "yaml",
  "diff",
  "rust",
  "go",
];

const ALIAS_TO_ID = {
  plain: "plain",
  text: "plain",
  txt: "plain",
  javascript: "javascript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  typescript: "typescript",
  ts: "typescript",
  tsx: "typescript",
  html: "html",
  htm: "html",
  markup: "html",
  janus: "html",
  xml: "xml",
  svg: "xml",
  css: "css",
  json: "json",
  csv: "csv",
  markdown: "markdown",
  md: "markdown",
  shell: "shell",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  perl: "perl",
  pl: "perl",
  python: "python",
  py: "python",
  c: "c",
  h: "c",
  cpp: "cpp",
  "c++": "cpp",
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
  rust: "rust",
  rs: "rust",
  go: "go",
  golang: "go",
};

/**
 * Map a user/language/class name to a canonical id, or null if unknown.
 * @param {string|null|undefined} name
 */
export const resolveLanguageId = (name) => {
  if (
    name === undefined ||
    name === null ||
    name === ""
  ) {
    return null;
  }
  const key = String(name).trim().toLowerCase();
  return ALIAS_TO_ID[key] || null;
};
