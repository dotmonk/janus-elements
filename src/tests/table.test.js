import {
  test,
} from "node:test";
import assert from "node:assert/strict";

import {
  visibleRange,
} from "../janus/ui/Table.js";

test(
  "visibleRange returns an empty window for no rows",
  () => {
    assert.deepEqual(
      visibleRange(
        0,
        320,
        40,
        0,
        5,
      ),
      {
        start: 0,
        end: 0,
      },
    );
  },
);

test(
  "visibleRange covers the viewport plus overscan",
  () => {
    assert.deepEqual(
      visibleRange(
        0,
        320,
        40,
        5000,
        5,
      ),
      {
        start: 0,
        end: 13,
      },
    );
  },
);

test(
  "visibleRange shifts with scrollTop",
  () => {
    assert.deepEqual(
      visibleRange(
        8000,
        320,
        40,
        5000,
        5,
      ),
      {
        start: 195,
        end: 213,
      },
    );
  },
);

test(
  "visibleRange clamps to the row count",
  () => {
    assert.deepEqual(
      visibleRange(
        0,
        320,
        40,
        3,
        5,
      ),
      {
        start: 0,
        end: 3,
      },
    );
  },
);
