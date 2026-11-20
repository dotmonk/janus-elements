import {
  readdirSync,
  statSync,
} from "node:fs";
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";

/** Install location of the janus-elements package (bin / scripts). */
export const packageRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * Project being operated on: the caller's working directory.
 * `januse lint|format|dev` resolve relative paths and (for dev) the document
 * root against this, so the CLI works from this repo and from consumer apps.
 */
export const projectRoot = () => process.cwd();

/** @deprecated Use packageRoot or projectRoot(); kept for existing tests. */
export const repoRoot = packageRoot;

const SKIPPED_DIRECTORY_NAMES = new Set(
  [
    "node_modules",
    ".git",
  ],
);
const SKIPPED_REPO_PATHS = new Set(
  [
    "docs/lib",
  ],
);

const projectPath = (absolutePath) => relative(
  projectRoot(),
  absolutePath,
).split("\\").join("/");

const isSkippedDirectory = (absolutePath, name) => SKIPPED_DIRECTORY_NAMES.has(name) || SKIPPED_REPO_PATHS.has(projectPath(absolutePath));

export class UsageError extends Error {}

export function splitExcludes(argv) {
  const rest = [];
  const excludes = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--exclude") {
      rest.push(argv[index]);
      continue;
    }
    const pattern = argv[index + 1];
    if (
      pattern === undefined ||
      pattern.startsWith("-")
    ) {
      throw new UsageError("--exclude needs a pattern");
    }
    excludes.push(pattern);
    index += 1;
  }
  return {
    rest,
    excludes,
  };
}

const globToRegExp = (pattern) => {
  const normalized = (isAbsolute(pattern)
    ? projectPath(pattern)
    : pattern).split("\\").join("/").replace(
    /^\.\//,
    "",
  ).replace(
    /\/+$/,
    "",
  );
  if (normalized === "") {
    throw new UsageError(`--exclude "${pattern}" would exclude the whole directory`);
  }
  let source = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (normalized.startsWith(
      "**/",
      index,
    )) {
      source += "(?:.*/)?";
      index += 2;
    } else if (normalized.startsWith(
      "**",
      index,
    )) {
      source += ".*";
      index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character.replace(
        /[.+^${}()|[\]\\]/,
        "\\$&",
      );
    }
  }
  return new RegExp(`^${source}$`);
};

// Relative targets resolve against cwd (works for the published `januse` bin).
export function collectFiles(targets, extensions, excludes = []) {
  const wanted = new Set(extensions);
  const found = new Set();
  const excludePatterns = excludes.map(globToRegExp);
  const isExcluded = (absolutePath) => {
    const path = projectPath(absolutePath);
    return excludePatterns.some(
      (pattern) => pattern.test(path),
    );
  };

  const visit = (absolutePath, isRoot) => {
    if (isExcluded(absolutePath)) {
      return;
    }
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      const name = absolutePath.split(/[\\/]/).pop();
      if (
        !isRoot &&
        isSkippedDirectory(
          absolutePath,
          name,
        )
      ) {
        return;
      }
      for (const entry of readdirSync(
        absolutePath,
        {
          withFileTypes: true,
        },
      )) {
        if (entry.isSymbolicLink()) {
          continue;
        }
        visit(
          join(
            absolutePath,
            entry.name,
          ),
          false,
        );
      }
    } else if (
      stats.isFile() &&
      wanted.has(extname(absolutePath))
    ) {
      found.add(absolutePath);
    }
  };

  for (const target of targets) {
    visit(
      isAbsolute(target)
        ? target
        : resolve(
            process.cwd(),
            target,
          ),
      true,
    );
  }
  return [
    ...found,
  ].sort();
}

export function defaultTargets(argvPaths) {
  return argvPaths.length === 0
    ? [
        "src",
      ]
    : argvPaths;
}
