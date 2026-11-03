#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "src/janus/ui/exports.manifest.json");
const packagePath = join(root, "package.json");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const exports = {};
const sideEffects = new Set(manifest.extraSideEffects || []);

for (const [subpath, entry] of Object.entries(manifest.exports)) {
  exports[subpath] = {
    types: entry.types,
    import: entry.file,
    default: entry.file,
  };
  if (entry.sideEffect) {
    sideEffects.add(entry.file);
  }
}

packageJson.exports = exports;
packageJson.sideEffects = [...sideEffects].sort();

writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(
  `Synced ${Object.keys(exports).length} exports and ${packageJson.sideEffects.length} sideEffects`
);
