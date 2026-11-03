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

export const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

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

const isSkippedDirectory = (absolutePath, name) => SKIPPED_DIRECTORY_NAMES.has(name) || SKIPPED_REPO_PATHS.has(relative(
  repoRoot,
  absolutePath,
).split("\\").join("/"));

// Relative targets resolve against cwd (works for the published `januse` bin).
export function collectFiles(targets, extensions) {
  const wanted = new Set(extensions);
  const found = new Set();

  const visit = (absolutePath, isRoot) => {
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
