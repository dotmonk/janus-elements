#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scripts = join(root, "scripts", "januse");

const usage = `Usage:
  januse lint [--exclude pattern]... [paths...]
  januse format [--check] [--exclude pattern]... [paths...]
  januse dev [--watch path]... [--sync from:to] [watchPaths...]

Paths resolve against the current working directory.
januse dev serves that directory (not the package install path).
--watch may be repeated. Default watch path is src when omitted.
--exclude skips matching files and directories (relative to the current
directory; *, ** and ? are wildcards) and may be repeated.
`;

const command = process.argv[2];
const argv = process.argv.slice(3);

if (!command || command === "-h" || command === "--help") {
  process.stdout.write(usage);
  process.exit(command ? 0 : 1);
}

const load = async (name) =>
  import(pathToFileURL(join(scripts, name)).href);

const exitOnUsageError = async (run) => {
  const { UsageError } = await load("walk.mjs");
  try {
    process.exit(await run());
  } catch (error) {
    if (!(error instanceof UsageError)) {
      throw error;
    }
    process.stderr.write(`januse ${command}: ${error.message}\n${usage}`);
    process.exit(1);
  }
};

if (command === "lint") {
  const { runLint } = await load("lint.mjs");
  await exitOnUsageError(() => runLint(argv));
}

if (command === "format") {
  const { runFormat } = await load("format.mjs");
  await exitOnUsageError(() => runFormat(argv));
}

if (command === "dev") {
  const { runDev } = await load("dev.mjs");
  await runDev(argv);
  // keeps process alive
} else {
  process.stderr.write(`Unknown command: ${command}\n${usage}`);
  process.exit(1);
}
