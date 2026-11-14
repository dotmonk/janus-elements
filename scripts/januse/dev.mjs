import { createServer } from "node:http";
import { createJanuseDev } from "./createDev.mjs";
import { defaultTargets, projectRoot } from "./walk.mjs";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8000);

function parseArgs(argv) {
  let sync = null;
  const watchFlags = [];
  const paths = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--sync") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-") || !value.includes(":")) {
        throw new Error('dev --sync requires from:to (e.g. "src/janus:docs/lib/janus")');
      }
      const split = value.indexOf(":");
      sync = {
        from: value.slice(0, split),
        to: value.slice(split + 1),
      };
      index += 1;
      continue;
    }
    if (arg === "--watch") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("dev --watch requires a path");
      }
      watchFlags.push(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    paths.push(arg);
  }
  const watchPaths = [
    ...new Set(
      watchFlags.length > 0 || paths.length > 0
        ? [...watchFlags, ...paths]
        : defaultTargets([]),
    ),
  ];
  return {
    sync,
    watchPaths,
  };
}

export async function runDev(argv) {
  const { sync, watchPaths } = parseArgs(argv);
  const root = projectRoot();
  const { middleware, handleUpgrade } = createJanuseDev({
    root,
    watch: watchPaths,
    sync,
  });

  const server = createServer((request, response) => {
    middleware(request, response, () => {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end("Not found");
    });
  });

  server.on("upgrade", handleUpgrade);

  server.listen(port, host, () => {
    console.log(`januse dev at http://${host}:${port}/ (cwd ${root})`);
    if (sync) {
      console.log(`Sync ${sync.from} → ${sync.to}`);
    }
  });
}

export { createJanuseDev } from "./createDev.mjs";
