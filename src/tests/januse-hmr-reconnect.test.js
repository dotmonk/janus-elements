import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";
import vm from "node:vm";
import test from "node:test";
import {
  createJanuseDev,
} from "../../scripts/januse/createDev.mjs";

const servedHmrScript = () => {
  const root = mkdtempSync(join(
    tmpdir(),
    "januse-hmr-",
  ));
  try {
    writeFileSync(
      join(
        root,
        "index.html",
      ),
      "<!doctype html><html><body></body></html>",
    );
    const januse = createJanuseDev(
      {
        root,
      },
    );
    let body = "";
    januse.middleware(
      {
        url: "/index.html",
      },
      {
        writeHead() {},
        end(chunk) {
          body = chunk.toString();
        },
      },
      () => {
        throw new Error("index.html was not served");
      },
    );
    januse.close();
    return body.match(/<script>([\s\S]*)<\/script>/)[1];
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

const runHmrClient = (fetchResults) => {
  const sockets = [];
  const timers = [];
  const fetchCalls = [];
  let reloads = 0;

  class FakeWebSocket {

    constructor(url) {
      this.url = url;
      this.listeners = {};
      sockets.push(this);
    }

    addEventListener(type, listener) {
      this.listeners[type] = listener;
    }
  }

  const context = {
    location: {
      protocol: "http:",
      host: "127.0.0.1:3010",
      href: "http://127.0.0.1:3010/",
      reload: () => {
        reloads++;
      },
    },
    WebSocket: FakeWebSocket,
    fetch: async (url) => {
      fetchCalls.push(url);
      const result = fetchResults.shift();
      if (result instanceof Error) {
        throw result;
      }
      return result;
    },
    setTimeout: (callback, delay) => {
      timers.push(
        {
          callback,
          delay,
        },
      );
    },
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(
    servedHmrScript(),
    context,
  );
  const runNextTimer = async () => {
    const timer = timers.shift();
    assert.ok(
      timer,
      "expected a scheduled retry",
    );
    await timer.callback();
    await new Promise(
      (resolve) => setImmediate(resolve),
    );
    return timer.delay;
  };
  return {
    socket: sockets[0],
    timers,
    fetchCalls,
    runNextTimer,
    reloads: () => reloads,
  };
};

test(
  "after the HMR socket closes the page reloads only once the server answers",
  async () => {
    const client = runHmrClient(
      [
        new TypeError("connection refused"),
        {
          ok: false,
        },
        {
          ok: true,
        },
      ],
    );
    client.socket.listeners.close();

    const delays = [];
    delays.push(await client.runNextTimer());
    assert.equal(
      client.reloads(),
      0,
    );
    delays.push(await client.runNextTimer());
    assert.equal(
      client.reloads(),
      0,
    );
    delays.push(await client.runNextTimer());

    assert.equal(
      client.reloads(),
      1,
    );
    assert.deepEqual(
      client.fetchCalls,
      [
        "http://127.0.0.1:3010/",
        "http://127.0.0.1:3010/",
        "http://127.0.0.1:3010/",
      ],
    );
    assert.ok(
      delays[1] > delays[0] && delays[2] > delays[1],
      `retry delays should grow: ${delays}`,
    );
    assert.equal(
      client.timers.length,
      0,
    );
  },
);

test(
  "retry delay stops growing at five seconds",
  async () => {
    const client = runHmrClient(Array.from(
      {
        length: 12,
      },
      () => new TypeError("connection refused"),
    ));
    client.socket.listeners.close();
    let delay = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      delay = await client.runNextTimer();
    }
    assert.equal(
      delay,
      5000,
    );
    assert.equal(
      client.reloads(),
      0,
    );
  },
);

test(
  "the HMR client marks registrations made while it applies an update",
  async () => {
    const context = {
      location: {
        protocol: "http:",
        host: "127.0.0.1:3010",
        href: "http://127.0.0.1:3010/",
      },
      WebSocket: class {

        constructor() {
          context.socket = this;
          this.listeners = {};
        }

        addEventListener(type, listener) {
          this.listeners[type] = listener;
        }
      },
      console: {
        error() {},
      },
    };
    context.globalThis = context;
    globalThis.hmrProbeContext = context;
    vm.runInNewContext(
      servedHmrScript(),
      context,
      {
        importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
      },
    );
    const probeModule = "globalThis.hmrProbeObserved = globalThis.hmrProbeContext.__JANUSE_HMR_UPDATING__; //";
    await context.socket.listeners.message(
      {
        data: JSON.stringify(
          {
            type: "update",
            url: `data:text/javascript,${encodeURIComponent(probeModule)}`,
            t: 1,
          },
        ),
      },
    );
    assert.equal(
      globalThis.hmrProbeObserved,
      1,
    );
    assert.equal(
      context.__JANUSE_HMR_UPDATING__,
      0,
    );
  },
);
