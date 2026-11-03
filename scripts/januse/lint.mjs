import { readFileSync } from "node:fs";
import { extname, relative } from "node:path";
import { collectLint, parse } from "./js-syntax.mjs";
import { collectFiles, defaultTargets, repoRoot } from "./walk.mjs";

const JS_EXTS = new Set([".js", ".mjs", ".ts"]);

const SHARED_GLOBALS = [
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Symbol",
  "BigInt",
  "Math",
  "JSON",
  "Date",
  "RegExp",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "URIError",
  "EvalError",
  "ReferenceError",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Proxy",
  "Reflect",
  "Intl",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  "TextEncoder",
  "TextDecoder",
  "queueMicrotask",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "encodeURI",
  "decodeURI",
  "encodeURIComponent",
  "decodeURIComponent",
  "undefined",
  "NaN",
  "Infinity",
  "console",
  "structuredClone",
];

const BROWSER_GLOBALS = [
  "window",
  "self",
  "globalThis",
  "document",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "customElements",
  "HTMLElement",
  "HTMLButtonElement",
  "Element",
  "Node",
  "ShadowRoot",
  "DocumentFragment",
  "MutationObserver",
  "ResizeObserver",
  "IntersectionObserver",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "getComputedStyle",
  "matchMedia",
  "CSSStyleSheet",
  "CSS",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "FocusEvent",
  "InputEvent",
  "FormData",
  "Blob",
  "File",
  "FileReader",
  "Image",
  "DOMParser",
  "XMLSerializer",
  "fetch",
  "Headers",
  "Request",
  "Response",
  "WebSocket",
  "Worker",
  "performance",
  "crypto",
  "btoa",
  "atob",
  "alert",
  "confirm",
  "prompt",
  "getSelection",
  "DOMRect",
  "DOMTokenList",
  "DOMMatrix",
  "DOMPoint",
  "NodeFilter",
  "Range",
  "Selection",
  "TreeWalker",
  "NodeIterator",
  "Document",
  "HTMLCollection",
  "NodeList",
  "NamedNodeMap",
];

const NODE_GLOBALS = [
  "global",
  "globalThis",
  "process",
  "Buffer",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "setImmediate",
  "clearImmediate",
];

const TEST_GLOBALS = [
  "test",
  "describe",
  "it",
  "before",
  "after",
  "beforeEach",
  "afterEach",
  "suite",
];

function globalsFor(filePath) {
  const rel = relative(repoRoot, filePath).split("\\").join("/");
  const globals = new Set([...SHARED_GLOBALS, ...BROWSER_GLOBALS, "globalThis"]);
  if (
    rel.startsWith("scripts/") ||
    rel.startsWith("bin/") ||
    rel.endsWith(".test.js") ||
    rel === "playwright.config.js"
  ) {
    for (const name of NODE_GLOBALS) {
      globals.add(name);
    }
  }
  if (rel.endsWith(".test.js") || rel.endsWith(".spec.js") || rel.includes("/tests/")) {
    for (const name of TEST_GLOBALS) {
      globals.add(name);
    }
    for (const name of NODE_GLOBALS) {
      globals.add(name);
    }
  }
  return globals;
}

export async function runLint(argv) {
  const targets = defaultTargets(argv.filter((arg) => !arg.startsWith("-")));
  const files = collectFiles(targets, [...JS_EXTS]);
  let findings = 0;

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const typescript = extname(file) === ".ts" || file.endsWith(".d.ts");
    const { ast, error } = parse(source, { typescript });
    const rel = relative(repoRoot, file).split("\\").join("/");
    if (error) {
      findings += 1;
      process.stderr.write(
        `${rel}:${error.line}:${error.column}: parse-error: ${error.message}\n`,
      );
      continue;
    }
    const issues = collectLint(ast, source, { globals: globalsFor(file) });
    for (const issue of issues) {
      findings += 1;
      process.stderr.write(
        `${rel}:${issue.line}:${issue.column}: ${issue.rule}: ${issue.message}\n`,
      );
    }
  }

  if (findings === 0) {
    process.stdout.write(`lint: ${files.length} files clean\n`);
    return 0;
  }
  process.stderr.write(`lint: ${findings} issue(s) in ${files.length} files\n`);
  return 1;
}
