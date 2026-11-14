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
import { createHash } from "node:crypto";
import { projectRoot } from "./walk.mjs";

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
    globalThis.__JANUSE_HMR_UPDATING__ = (globalThis.__JANUSE_HMR_UPDATING__ || 0) + 1;
    try {
      await import(url);
    } catch (error) {
      console.error("[januse hmr] failed to reload", payload.url, error);
    } finally {
      globalThis.__JANUSE_HMR_UPDATING__--;
    }
  });
  socket.addEventListener("close", () => {
    let delay = 250;
    const reloadWhenServerAnswers = async () => {
      try {
        const response = await fetch(location.href, { cache: "no-store" });
        if (response.ok) {
          location.reload();
          return;
        }
      } catch {}
      delay = Math.min(delay * 2, 5000);
      setTimeout(reloadWhenServerAnswers, delay);
    };
    setTimeout(reloadWhenServerAnswers, delay);
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

function makeSync(cwd, fromRel, toRel) {
  const fromDir = resolve(cwd, fromRel);
  const toDir = resolve(cwd, toRel);
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
    fromRel,
    toRel,
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

function toPosix(p) {
  return p.split("\\").join("/");
}

/**
 * Programmatic januse dev server pieces for embedding (e.g. Express).
 *
 * @param {{
 *   root?: string,
 *   watch?: string[],
 *   sync?: { from: string, to: string } | null,
 * }} [options]
 * @returns {{
 *   middleware: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, next: (err?: unknown) => void) => void,
 *   handleUpgrade: (req: import("node:http").IncomingMessage, socket: import("node:stream").Duplex, head: Buffer) => void,
 *   close: () => void,
 * }}
 */
export function createJanuseDev(options = {}) {
  const cwd = projectRoot();
  const serveRoot = resolve(options.root ?? cwd);
  const watchPaths = options.watch ?? [];
  const sync = options.sync ?? null;

  const syncer = sync ? makeSync(cwd, sync.from, sync.to) : null;
  if (syncer) {
    syncer.runSync();
  }

  const clients = new Set();
  const watchers = [];
  let notifyTimer = null;
  const pendingUrls = new Set();
  let closed = false;

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

  const urlUnderServeRoot = (absolute) => {
    const rel = toPosix(relative(serveRoot, absolute));
    if (!rel || rel === "." || rel.startsWith("..") || rel.includes(`..${sep}`)) {
      return null;
    }
    return `/${rel}`;
  };

  const onWatchEvent = (_eventType, filename, watchRoot) => {
    if (!filename || closed) {
      return;
    }
    const absolute = resolve(watchRoot, filename);
    if (syncer?.covers(absolute)) {
      syncer.scheduleSync();
    }
    if (
      !(
        absolute.endsWith(".js") ||
        absolute.endsWith(".mjs") ||
        absolute.endsWith(".css") ||
        absolute.endsWith(".svg")
      )
    ) {
      return;
    }
    const direct = urlUnderServeRoot(absolute);
    if (direct) {
      scheduleNotify(direct);
    }
    if (syncer && syncer.covers(absolute)) {
      const fromRel = toPosix(relative(cwd, syncer.fromDir));
      const absRel = toPosix(relative(cwd, absolute));
      if (absRel === fromRel || absRel.startsWith(`${fromRel}/`)) {
        const suffix = absRel.slice(fromRel.length);
        const destAbs = join(syncer.toDir, suffix.replace(/^\//, ""));
        const mapped = urlUnderServeRoot(destAbs);
        if (mapped) {
          scheduleNotify(mapped);
        }
      }
    }
  };

  for (const watchPath of watchPaths) {
    const absolute = resolve(cwd, watchPath);
    if (!existsSync(absolute)) {
      throw new Error(`Watch path not found: ${watchPath}`);
    }
    const watcher = watch(absolute, { recursive: true }, (eventType, filename) => {
      onWatchEvent(eventType, filename, absolute);
    });
    watchers.push(watcher);
    console.log(`Watching ${watchPath}`);
  }

  const resolveServePath = (requestUrl) => {
    const pathOnly = decodeURIComponent((requestUrl || "/").split("?")[0]);
    if (pathOnly.startsWith("/gold_")) {
      return null;
    }
    const absolute = resolve(serveRoot, `.${pathOnly}`);
    if (absolute !== serveRoot && !absolute.startsWith(`${serveRoot}${sep}`)) {
      return null;
    }
    return absolute;
  };

  const middleware = (request, response, next) => {
    if (request.url?.startsWith("/__januse_hmr")) {
      response.writeHead(400, { "Cache-Control": "no-store" });
      response.end("WebSocket only");
      return;
    }

    const absolute = resolveServePath(request.url);
    if (!absolute) {
      next();
      return;
    }

    let filePath = absolute;
    try {
      const stats = existsSync(filePath) ? statSync(filePath) : null;
      if (stats?.isDirectory()) {
        filePath = join(filePath, "index.html");
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        next();
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
  };

  const handleUpgrade = (request, socket, head) => {
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
    client.on("data", () => { });
  };

  const close = () => {
    closed = true;
    clearTimeout(notifyTimer);
    for (const watcher of watchers) {
      watcher.close();
    }
    watchers.length = 0;
    for (const client of clients) {
      try {
        client.destroy();
      } catch {
        /* ignore */
      }
    }
    clients.clear();
  };

  return { middleware, handleUpgrade, close };
}
