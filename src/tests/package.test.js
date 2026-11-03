import {
  test,
} from "node:test";
import assert from "node:assert/strict";
import {
  execFileSync,
} from "node:child_process";
import {
  readFileSync,
} from "node:fs";
import {
  dirname,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";

const root = new URL(
  "../../",
  import.meta.url,
);
const packageJson = JSON.parse(readFileSync(
  new URL(
    "package.json",
    root,
  ),
  "utf8",
));
const manifest = JSON.parse(readFileSync(
  new URL(
    "src/janus/ui/exports.manifest.json",
    root,
  ),
  "utf8",
));

const expectedExports = () => {
  const exports = {};
  for (const [
    subpath,
    entry,
  ] of Object.entries(manifest.exports)) {
    exports[subpath] = {
      types: entry.types,
      import: entry.file,
      default: entry.file,
    };
  }
  return exports;
};

const expectedSideEffects = () => {
  const sideEffects = new Set(manifest.extraSideEffects || []);
  for (const entry of Object.values(manifest.exports)) {
    if (entry.sideEffect) {
      sideEffects.add(entry.file);
    }
  }
  return [
    ...sideEffects,
  ].sort();
};

test(
  "package is named janus-elements at version 0.1.0 and publishable",
  () => {
    assert.equal(
      packageJson.name,
      "janus-elements",
    );
    assert.equal(
      packageJson.version,
      "0.1.0",
    );
    assert.equal(
      packageJson.private,
      undefined,
    );
    assert.equal(
      packageJson.license,
      "MIT",
    );
  },
);

test(
  "the published files are the library, januse CLI, and documents",
  () => {
    const [
      packed,
    ] = JSON.parse(execFileSync(
      "npm",
      [
        "pack",
        "--dry-run",
        "--json",
      ],
      {
        cwd: root,
        encoding: "utf8",
        stdio: [
          "ignore",
          "pipe",
          "ignore",
        ],
      },
    ));
    const files = packed.files.map(
      (file) => file.path,
    ).sort();

    for (const required of [
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "package.json",
      "bin/januse.mjs",
      "scripts/januse/format.mjs",
      "src/janus/index.js",
      "src/janus/index.d.ts",
      "src/janus/ui/index.js",
      "src/janus/ui/index.d.ts",
      "src/janus/ui/Button.js",
      "src/janus/ui/Button.d.ts",
      "src/janus/ui/exports.manifest.json",
      "src/janus/ui/icon/search.js",
    ]) {
      assert.ok(
        files.includes(required),
        `${required} is published`,
      );
    }
    assert.equal(
      packageJson.bin.januse,
      "./bin/januse.mjs",
    );
    const unexpected = files.filter(
      (file) => ![
        "CHANGELOG.md",
        "LICENSE",
        "README.md",
        "package.json",
      ].includes(file) && !file.startsWith("src/janus/") && !file.startsWith("bin/") && !file.startsWith("scripts/januse/"),
    );
    assert.deepEqual(
      unexpected,
      [],
    );
  },
);

test(
  "package exports and sideEffects match the UI exports manifest",
  () => {
    assert.equal(
      packageJson.types,
      "./src/janus/index.d.ts",
    );
    assert.deepEqual(
      packageJson.exports,
      expectedExports(),
    );
    assert.deepEqual(
      packageJson.sideEffects,
      expectedSideEffects(),
    );
    assert.equal(
      Object.keys(packageJson.exports).length,
      94,
    );
    assert.deepEqual(
      packageJson.exports["./ui/latestAsync"],
      {
        types: "./src/janus/ui/latestAsync.d.ts",
        import: "./src/janus/ui/latestAsync.js",
        default: "./src/janus/ui/latestAsync.js",
      },
    );
    assert.deepEqual(
      packageJson.exports["./ui/createIcon"],
      {
        types: "./src/janus/ui/createIcon.d.ts",
        import: "./src/janus/ui/createIcon.js",
        default: "./src/janus/ui/createIcon.js",
      },
    );
    assert.deepEqual(
      packageJson.exports["./ui/button"],
      {
        types: "./src/janus/ui/Button.d.ts",
        import: "./src/janus/ui/Button.js",
        default: "./src/janus/ui/Button.js",
      },
    );
    assert.deepEqual(
      packageJson.exports["./ui/icons/search"],
      {
        types: "./src/janus/ui/icon.d.ts",
        import: "./src/janus/ui/icon/search.js",
        default: "./src/janus/ui/icon/search.js",
      },
    );
    assert.equal(
      packageJson.sideEffects.includes("./src/janus/ui/theme.js"),
      false,
    );
    assert.equal(
      packageJson.sideEffects.includes("./src/janus/ui/util.js"),
      false,
    );
  },
);

test(
  "the newest changelog entry matches the package version",
  () => {
    const changelog = readFileSync(
      new URL(
        "CHANGELOG.md",
        root,
      ),
      "utf8",
    );
    const [
      ,
      newest,
    ] = changelog.match(/^## \[?(\d+\.\d+\.\d+)/m);
    assert.equal(
      newest,
      packageJson.version,
    );
  },
);

test(
  "playwright webServer invokes januse via node, not a PATH bin",
  () => {
    const config = readFileSync(
      new URL(
        "playwright.config.js",
        root,
      ),
      "utf8",
    );
    const match = config.match(/command:\s*"((?:\\.|[^"\\])*)"/);
    assert.ok(
      match,
      "webServer command",
    );
    const command = match[1].replaceAll(
      "\\\"",
      "\"",
    );
    assert.match(
      command,
      /^node bin\/januse\.mjs dev /,
    );
    execFileSync(
      "node",
      [
        "bin/januse.mjs",
        "--help",
      ],
      {
        cwd: fileURLToPath(root),
        env: {
          PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
        },
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    );
  },
);
