import assert from "node:assert/strict";
import fs from "node:fs";
import {
  syncBuiltinESMExports,
} from "node:module";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";
import test from "node:test";

test(
  "--sync replaces a target directory that cannot be renamed (EXDEV, as in Docker overlayfs)",
  async () => {
    const root = fs.mkdtempSync(join(
      tmpdir(),
      "januse-sync-exdev-",
    ));
    const target = join(
      root,
      "out/lib",
    );
    fs.mkdirSync(
      join(
        root,
        "src/lib",
      ),
      {
        recursive: true,
      },
    );
    fs.mkdirSync(
      target,
      {
        recursive: true,
      },
    );
    fs.writeFileSync(
      join(
        root,
        "src/lib/a.js",
      ),
      "new",
    );
    fs.writeFileSync(
      join(
        target,
        "a.js",
      ),
      "old",
    );

    const realRenameSync = fs.renameSync;
    const previousCwd = process.cwd();
    fs.renameSync = (from, to) => {
      if (from === target) {
        throw Object.assign(
          new Error(`EXDEV: cross-device link not permitted, rename '${from}' -> '${to}'`),
          {
            code: "EXDEV",
          },
        );
      }
      realRenameSync(
        from,
        to,
      );
    };
    syncBuiltinESMExports();
    process.chdir(root);
    try {
      const {
        createJanuseDev,
      } = await import("../../scripts/januse/createDev.mjs");
      const dev = createJanuseDev(
        {
          root,
          watch: [],
          sync: {
            from: "src/lib",
            to: "out/lib",
          },
        },
      );
      dev.close();

      assert.equal(
        fs.readFileSync(
          join(
            target,
            "a.js",
          ),
          "utf8",
        ),
        "new",
      );
      assert.deepEqual(
        fs.readdirSync(join(
          root,
          "out",
        )),
        [
          "lib",
        ],
      );
    } finally {
      process.chdir(previousCwd);
      fs.renameSync = realRenameSync;
      syncBuiltinESMExports();
      fs.rmSync(
        root,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);
