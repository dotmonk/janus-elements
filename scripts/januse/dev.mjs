import { createServer } from "node:http";
import {
  watch,
  cpSync,
  rmSync,
  mkdirSync,
  renameSync,
  readFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { defaultTargets, repoRoot } from "./walk.mjs";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const HMR_CLIENT = `(() => {
  if (globalThis.__JANUSE_HMR__) return;
  globalThis.__JANUSE_HMR__ = true;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(proto + "://" + location.host + "/__januse_hmr");
  socket.addEventListener("message", async (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }
    if (payload.type !== "update" || !payload.url) return;
    const url = payload.url + (payload.url.includes("?") ? "&" : "?") + "t=" + payload.t;
    try {
      await import(url);
    } catch (error) {
      console.error("[januse hmr] failed to reload", payload.url, error);
    }
  });
  socket.addEventListener("close", () => {
    setTimeout(() => location.reload(), 500);
  });
})();`;

const tryRm = (path) => {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOTEMPTY" && error.code !== "EBUSY") {
      throw error;
    }
  }
};

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
  // Prefer explicit --watch roots; positional paths still count; default src.
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

function makeSync(fromRel, toRel) {
  const fromDir = resolve(repoRoot, fromRel);
  const toDir = resolve(repoRoot, toRel);
  const parent = dirname(toDir);
  let syncTimer = null;
  let syncing = false;
  let syncAgain = false;

  const syncOnce = () => {
    mkdirSync(parent, { recursive: true });
    const staging = join(parent, `.staging-${process.pid}`);
    const outgoing = join(parent, `.outgoing-${process.pid}`);
    tryRm(staging);
    tryRm(outgoing);
    cpSync(fromDir, staging, { recursive: true });
    if (existsSync(toDir)) {
      renameSync(toDir, outgoing);
    }
    renameSync(staging, toDir);
    tryRm(outgoing);
  };

  const runSync = () => {
    if (syncing) {
      syncAgain = true;
      return;
    }
    syncing = true;
    syncAgain = false;
    try {
      syncOnce();
      console.log(`Synced ${fromRel} → ${toRel}`);
    } catch (error) {
      console.error(`Sync failed: ${error.message}`);
    } finally {
      syncing = false;
      if (syncAgain) {
        scheduleSync();
      }
    }
  };

  const scheduleSync = () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(runSync, 100);
  };

  return {
    fromDir,
    toDir,
    runSync,
    scheduleSync,
    covers(absolutePath) {
      return (
        absolutePath === fromDir ||
        absolutePath.startsWith(`${fromDir}${sep}`)
      );
    },
  };
}

function resolvePath(requestUrl) {
  const pathOnly = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const absolute = resolve(repoRoot, `.${pathOnly}`);
  if (absolute !== repoRoot && !absolute.startsWith(`${repoRoot}${sep}`)) {
    return null;
  }
  return absolute;
}

function injectHmr(html) {
  const snippet = `<script>${HMR_CLIENT}</script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${snippet}</body>`);
  }
  return `${html}\n${snippet}\n`;
}

function acceptWebSocket(request, socket, head) {
  const key = request.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return null;
  }
  const accept = createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      "\r\n",
  );
  if (head?.length) {
    socket.unshift(head);
  }
  return socket;
}

function sendWsText(socket, text) {
  const payload = Buffer.from(text);
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(length, 6);
  }
  socket.write(Buffer.concat([header, payload]));
}

export async function runDev(argv) {
  const { sync, watchPaths } = parseArgs(argv);
  const syncer = sync ? makeSync(sync.from, sync.to) : null;
  if (syncer) {
    syncer.runSync();
  }

  const clients = new Set();
  let notifyTimer = null;
  const pendingUrls = new Set();

  const flushNotify = () => {
    notifyTimer = null;
    if (pendingUrls.size === 0 || clients.size === 0) {
      pendingUrls.clear();
      return;
    }
    const t = Date.now();
    for (const url of pendingUrls) {
      const message = JSON.stringify({ type: "update", url, t });
      for (const client of clients) {
        try {
          sendWsText(client, message);
        } catch {
          clients.delete(client);
        }
      }
    }
    pendingUrls.clear();
  };

  const scheduleNotify = (url) => {
    pendingUrls.add(url);
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(flushNotify, 50);
  };

  const onWatchEvent = (_eventType, filename, watchRoot) => {
    if (!filename) {
      return;
    }
    const absolute = resolve(watchRoot, filename);
    if (syncer?.covers(absolute)) {
      syncer.scheduleSync();
    }
    const rel = relative(repoRoot, absolute).split("\\").join("/");
    if (
      rel.endsWith(".js") ||
      rel.endsWith(".mjs") ||
      rel.endsWith(".css") ||
      rel.endsWith(".svg")
    ) {
      scheduleNotify(`/${rel}`);
      // Synced library copies are served under docs/lib — notify that URL too.
      if (syncer && syncer.covers(absolute)) {
        const fromRel = relative(repoRoot, syncer.fromDir).split("\\").join("/");
        const toRel = relative(repoRoot, syncer.toDir).split("\\").join("/");
        if (rel.startsWith(`${fromRel}/`) || rel === fromRel) {
          const suffix = rel.slice(fromRel.length);
          scheduleNotify(`/${toRel}${suffix}`);
        }
      }
    }
  };

  for (const watchPath of watchPaths) {
    const absolute = resolve(repoRoot, watchPath);
    if (!existsSync(absolute)) {
      throw new Error(`Watch path not found: ${watchPath}`);
    }
    watch(absolute, { recursive: true }, (eventType, filename) => {
      onWatchEvent(eventType, filename, absolute);
    });
    console.log(`Watching ${watchPath}`);
  }

  const server = createServer((request, response) => {
    if (request.url?.startsWith("/__januse_hmr")) {
      response.writeHead(400, { "Cache-Control": "no-store" });
      response.end("WebSocket only");
      return;
    }

    const absolute = resolvePath(request.url);
    if (!absolute) {
      response.writeHead(403, { "Cache-Control": "no-store" });
      response.end("Forbidden");
      return;
    }

    let filePath = absolute;
    try {
      const stats = existsSync(filePath) ? statSync(filePath) : null;
      if (stats?.isDirectory()) {
        filePath = join(filePath, "index.html");
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        });
        response.end("Not found");
        return;
      }
    } catch (error) {
      response.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(error.message);
      return;
    }

    const type =
      mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
    if (type.startsWith("text/html")) {
      let html = readFileSync(filePath, "utf8");
      html = injectHmr(html);
      const body = Buffer.from(html);
      response.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "Content-Length": body.length,
      });
      response.end(body);
      return;
    }

    const body = readFileSync(filePath);
    response.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "Content-Length": body.length,
    });
    response.end(body);
  });

  server.on("upgrade", (request, socket, head) => {
    const pathOnly = (request.url || "").split("?")[0];
    if (pathOnly !== "/__januse_hmr") {
      socket.destroy();
      return;
    }
    const client = acceptWebSocket(request, socket, head);
    if (!client) {
      return;
    }
    clients.add(client);
    client.on("close", () => clients.delete(client));
    client.on("error", () => clients.delete(client));
    // Drain frames so the TCP window stays open; ignore client→server data.
    client.on("data", () => {});
  });

  server.listen(port, host, () => {
    console.log(`januse dev at http://${host}:${port}/docs/`);
    if (syncer) {
      console.log(`Sync ${sync.from} → ${sync.to}`);
    }
  });
}
