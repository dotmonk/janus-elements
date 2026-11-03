import {
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  extname,
  relative,
} from "node:path";
import {
  parse,
  print,
} from "./js-syntax.mjs";
import {
  formatJson,
  formatMarkup,
} from "./text-format.mjs";
import {
  collectFiles,
  defaultTargets,
  repoRoot,
} from "./walk.mjs";

const FORMAT_EXTS = [
  ".js",
  ".mjs",
  ".ts",
  ".json",
  ".svg",
  ".html",
];

function formatSource(file, source) {
  const ext = extname(file).toLowerCase();
  if (ext === ".json") {
    return formatJson(source);
  }
  if (ext === ".svg") {
    return formatMarkup(
      source,
      {
        svg: true,
      },
    );
  }
  if (ext === ".html") {
    return formatMarkup(
      source,
      {
        svg: false,
      },
    );
  }
  if (
    ext === ".js" ||
    ext === ".mjs" ||
    ext === ".ts"
  ) {
    const typescript = ext === ".ts" || file.endsWith(".d.ts");
    const {
      ast,
      error,
    } = parse(
      source,
      {
        typescript,
      },
    );
    if (error) {
      const err = new Error(error.message);
      err.line = error.line;
      err.column = error.column;
      throw err;
    }
    return print(ast);
  }
  return source;
}

export async function runFormat(argv) {
  const check = argv.includes("--check");
  const targets = defaultTargets(argv.filter(
    (arg) => arg !== "--check" && !arg.startsWith("-"),
  ));
  const files = collectFiles(
    targets,
    FORMAT_EXTS,
  );
  let changed = 0;
  let errors = 0;

  for (const file of files) {
    const rel = relative(
      repoRoot,
      file,
    ).split("\\").join("/");
    // Extreme whitespace fixtures for format round-trips — must not be rewritten.
    if (
      rel.endsWith(".compact.js") ||
      rel.endsWith(".spaced.js")
    ) {
      continue;
    }
    const source = readFileSync(
      file,
      "utf8",
    );
    let next;
    try {
      next = formatSource(
        file,
        source,
      );
    } catch (error) {
      errors += 1;
      const where = error.line != null
        ? `${rel}:${error.line}:${error.column}`
        : rel;
      process.stderr.write(`${where}: format-error: ${error.message}\n`);
      continue;
    }
    if (next === source) {
      continue;
    }
    changed += 1;
    if (check) {
      process.stdout.write(`${rel}\n`);
    } else {
      writeFileSync(
        file,
        next,
      );
      process.stdout.write(`formatted ${rel}\n`);
    }
  }

  if (errors > 0) {
    process.stderr.write(`format: ${errors} error(s)\n`);
    return 1;
  }
  if (check) {
    if (changed > 0) {
      process.stderr.write(`format --check: ${changed} file(s) would change\n`);
      return -1;
    }
    process.stdout.write(`format --check: ${files.length} files clean\n`);
    return 0;
  }
  process.stdout.write(`format: ${changed} changed, ${files.length} files\n`);
  return 0;
}
