import assert from "node:assert/strict";
import test from "node:test";
import {
  createLatestAsync,
} from "../janus/ui/latestAsync.js";

const delay = (ms) => new Promise(
  (resolve) => setTimeout(
    resolve,
    ms,
  ),
);

test(
  "run delivers the latest result and ignores stale ones",
  async () => {
    const latest = createLatestAsync();
    let resolveSlow;
    const slow = new Promise(
      (resolve) => {
        resolveSlow = resolve;
      },
    );

    const first = latest.run(
      () => slow,
    );
    const second = latest.run(
      () => "fresh",
    );

    resolveSlow("stale");
    assert.equal(
      await first,
      undefined,
    );
    assert.equal(
      await second,
      "fresh",
    );
  },
);

test(
  "schedule debounces and coalesces to the last task",
  async () => {
    const latest = createLatestAsync(
      {
        debounceMs: 30,
      },
    );
    const seen = [];
    const first = latest.schedule(
      () => {
        seen.push("a");
        return "a";
      },
    );
    const second = latest.schedule(
      () => {
        seen.push("b");
        return "b";
      },
    );
    assert.equal(
      await first,
      undefined,
    );
    assert.equal(
      await second,
      "b",
    );
    assert.deepEqual(
      seen,
      [
        "b",
      ],
    );
  },
);

test(
  "cancel drops in-flight and pending scheduled work",
  async () => {
    const latest = createLatestAsync(
      {
        debounceMs: 40,
      },
    );
    let ran = false;
    const pending = latest.schedule(
      () => {
        ran = true;
        return "x";
      },
    );
    latest.cancel();
    assert.equal(
      await pending,
      undefined,
    );
    await delay(60);
    assert.equal(
      ran,
      false,
    );

    let resolveSlow;
    const slow = new Promise(
      (resolve) => {
        resolveSlow = resolve;
      },
    );
    const inFlight = latest.run(
      () => slow,
    );
    latest.cancel();
    resolveSlow("too-late");
    assert.equal(
      await inFlight,
      undefined,
    );
  },
);

test(
  "current task errors still reject",
  async () => {
    const latest = createLatestAsync();
    await assert.rejects(
      () => latest.run(
        () => Promise.reject(new Error("boom")),
      ),
      {
        message: "boom",
      },
    );
  },
);
