#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scripts = join(root, "scripts", "januse");

const usage = `Usage:
  januse lint [paths...]
  januse format [--check] [paths...]
  januse dev [--watch path]... [--sync from:to] [watchPaths...]

--watch may be repeated. Default watch path is src when omitted.
`;

const command = process.argv[2];
const argv = process.argv.slice(3);

if (!command || command === "-h" || command === "--help") {
  process.stdout.write(usage);
  process.exit(command ? 0 : 1);
}

const load = async (name) =>
  import(pathToFileURL(join(scripts, name)).href);

if (command === "lint") {
  const { runLint } = await load("lint.mjs");
  process.exit(await runLint(argv));
}

if (command === "format") {
  const { runFormat } = await load("format.mjs");
  process.exit(await runFormat(argv));
}

if (command === "dev") {
  const { runDev } = await load("dev.mjs");
  await runDev(argv);
  // keeps process alive
} else {
  process.stderr.write(`Unknown command: ${command}\n${usage}`);
  process.exit(1);
}
