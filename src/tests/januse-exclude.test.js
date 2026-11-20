import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import {
  dirname,
  join,
} from "node:path";
import {
  spawnSync,
} from "node:child_process";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const januseBin = fileURLToPath(new URL(
  "../../bin/januse.mjs",
  import.meta.url,
));

const cleanSource = "export const answer = 42;\n";
const lintFailure = "export const broken = () => undefinedThing;\n";
const unformatted = "export const   messy={a:1};\n";

const withProject = (run) => {
  const root = mkdtempSync(join(
    tmpdir(),
    "januse-exclude-",
  ));
  const write = (path, source) => {
    mkdirSync(
      dirname(join(
        root,
        path,
      )),
      {
        recursive: true,
      },
    );
    writeFileSync(
      join(
        root,
        path,
      ),
      source,
    );
  };
  try {
    run(
      root,
      write,
    );
  } finally {
    rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  }
};

const januse = (root, ...args) => spawnSync(
  process.execPath,
  [
    januseBin,
    ...args,
  ],
  {
    cwd: root,
    encoding: "utf8",
  },
);

const generatedTree = (write, source) => {
  write(
    "frontend/app.js",
    cleanSource,
  );
  write(
    "frontend/lib/janus.js",
    source,
  );
  write(
    "frontend/client.gen.js",
    source,
  );
  write(
    "frontend/vendor/deep/chart.min.js",
    source,
  );
};

const excludes = [
  "--exclude",
  "frontend/lib",
  "--exclude",
  "frontend/client.*",
  "--exclude",
  "**/*.min.js",
];

test(
  "lint --exclude skips matching directories and files",
  () => withProject(
    (root, write) => {
      generatedTree(
        write,
        lintFailure,
      );

      const everything = januse(
        root,
        "lint",
        "frontend",
      );
      assert.equal(
        everything.status,
        1,
      );
      assert.match(
        everything.stderr,
        /3 issue\(s\) in 4 files/,
      );

      const excluded = januse(
        root,
        "lint",
        ...excludes,
        "frontend",
      );
      assert.equal(
        excluded.status,
        0,
        excluded.stderr,
      );
      assert.match(
        excluded.stdout,
        /lint: 1 files clean/,
      );
    },
  ),
);

test(
  "format --exclude leaves matching files untouched",
  () => withProject(
    (root, write) => {
      generatedTree(
        write,
        unformatted,
      );

      const check = januse(
        root,
        "format",
        "--check",
        ...excludes,
        "frontend",
      );
      assert.equal(
        check.status,
        0,
        check.stdout + check.stderr,
      );

      const formatted = januse(
        root,
        "format",
        ...excludes,
        "frontend",
      );
      assert.equal(
        formatted.status,
        0,
        formatted.stderr,
      );
      for (const path of [
        "frontend/lib/janus.js",
        "frontend/client.gen.js",
        "frontend/vendor/deep/chart.min.js",
      ]) {
        assert.equal(
          readFileSync(
            join(
              root,
              path,
            ),
            "utf8",
          ),
          unformatted,
          path,
        );
      }
    },
  ),
);

test(
  "a single * does not cross directories; ? matches one character",
  () => withProject(
    (root, write) => {
      write(
        "src/a.js",
        lintFailure,
      );
      write(
        "src/nested/a.js",
        lintFailure,
      );
      write(
        "src/b1.js",
        lintFailure,
      );

      const result = januse(
        root,
        "lint",
        "--exclude",
        "src/*.js",
        "src",
      );
      assert.equal(
        result.status,
        1,
      );
      assert.match(
        result.stderr,
        /src\/nested\/a\.js/,
      );
      assert.match(
        result.stderr,
        /1 issue\(s\) in 1 files/,
      );

      const single = januse(
        root,
        "lint",
        "--exclude",
        "src/b?.js",
        "--exclude",
        "src/nested",
        "src",
      );
      assert.match(
        single.stderr,
        /1 issue\(s\) in 1 files/,
      );
      assert.match(
        single.stderr,
        /src\/a\.js/,
      );
    },
  ),
);

test(
  "an empty --exclude pattern is an error, not a silent skip of everything",
  () => withProject(
    (root, write) => {
      write(
        "a.js",
        lintFailure,
      );
      for (const pattern of [
        "",
        "./",
      ]) {
        const result = januse(
          root,
          "lint",
          "--exclude",
          pattern,
          ".",
        );
        assert.equal(
          result.status,
          1,
        );
        assert.match(
          result.stderr,
          /would exclude the whole directory/,
        );
      }
    },
  ),
);

test(
  "--exclude without a pattern is an error",
  () => withProject(
    (root) => {
      const result = januse(
        root,
        "lint",
        "--exclude",
      );
      assert.equal(
        result.status,
        1,
      );
      assert.match(
        result.stderr,
        /--exclude needs a pattern/,
      );
    },
  ),
);
