import assert from "node:assert/strict";
import {
  createServer,
} from "node:http";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";
import {
  spawn,
} from "node:child_process";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const packageRoot = fileURLToPath(new URL(
  "../../",
  import.meta.url,
));
const januseBin = join(
  packageRoot,
  "bin/januse.mjs",
);

const freePort = () => new Promise(
  (resolve, reject) => {
    const server = createServer();
    server.listen(
      0,
      "127.0.0.1",
      () => {
        const {
          port,
        } = server.address();
        server.close(
          (error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(port);
          },
        );
      },
    );
    server.on(
      "error",
      reject,
    );
  },
);

const waitForLog = (child, pattern, timeoutMs = 10000) => new Promise(
  (resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(
      () => {
        cleanup();
        reject(new Error(`Timed out waiting for ${pattern}; got:\n${buffer}`));
      },
      timeoutMs,
    );
    const onData = (chunk) => {
      buffer += chunk.toString();
      if (pattern.test(buffer)) {
        cleanup();
        resolve(buffer);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off(
        "data",
        onData,
      );
      child.stderr.off(
        "data",
        onData,
      );
    };
    child.stdout.on(
      "data",
      onData,
    );
    child.stderr.on(
      "data",
      onData,
    );
  },
);

test(
  "januse dev serves files from process cwd, not the package root",
  async () => {
    const dir = mkdtempSync(join(
      tmpdir(),
      "januse-cwd-",
    ));
    const marker = `cwd-root-${Date.now()}`;
    writeFileSync(
      join(
        dir,
        "index.html",
      ),
      `<!doctype html><title>${marker}</title>\n`,
    );
    const port = await freePort();
    const child = spawn(
      process.execPath,
      [
        januseBin,
        "dev",
        "--watch",
        ".",
        ".",
      ],
      {
        cwd: dir,
        env: {
          ...process.env,
          PORT: String(port),
        },
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    );
    try {
      await waitForLog(
        child,
        /januse dev at/,
      );
      const response = await fetch(`http://127.0.0.1:${port}/`);
      assert.equal(
        response.status,
        200,
      );
      const body = await response.text();
      assert.match(
        body,
        new RegExp(marker),
      );
      assert.doesNotMatch(
        body,
        /Janus Elements/,
      );
    } finally {
      child.kill("SIGTERM");
      await new Promise(
        (resolve) => {
          child.on(
            "exit",
            resolve,
          );
          setTimeout(
            resolve,
            1000,
          );
        },
      );
      rmSync(
        dir,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);

test(
  "januse dev from the package cwd still reaches docs/",
  async () => {
    const port = await freePort();
    const child = spawn(
      process.execPath,
      [
        januseBin,
        "dev",
        "--watch",
        "docs",
        "docs",
      ],
      {
        cwd: packageRoot,
        env: {
          ...process.env,
          PORT: String(port),
        },
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    );
    try {
      await waitForLog(
        child,
        /januse dev at/,
      );
      const response = await fetch(`http://127.0.0.1:${port}/docs/`);
      assert.equal(
        response.status,
        200,
      );
      const body = await response.text();
      assert.match(
        body,
        /Janus Elements/,
      );
    } finally {
      child.kill("SIGTERM");
      await new Promise(
        (resolve) => {
          child.on(
            "exit",
            resolve,
          );
          setTimeout(
            resolve,
            1000,
          );
        },
      );
    }
  },
);
