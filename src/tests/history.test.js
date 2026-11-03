import {
  test,
} from "node:test";
import assert from "node:assert/strict";

import {
  EditHistory,
} from "../janus/ui/markdown/history.js";

const state = (markdown, start = 0) => ({
  markdown,
  selection: {
    start,
    end: start,
  },
});

test(
  "undo and redo step through recorded changes",
  () => {
    const history = new EditHistory(state(""));
    history.record(
      state(
        "a",
        1,
      ),
      {
        now: 0,
      },
    );
    history.record(
      state(
        "- a",
        1,
      ),
      {
        now: 10,
      },
    );
    assert.equal(
      history.undo().markdown,
      "a",
    );
    assert.equal(
      history.undo().markdown,
      "",
    );
    assert.equal(
      history.undo(),
      null,
    );
    assert.equal(
      history.redo().markdown,
      "a",
    );
    assert.equal(
      history.redo().markdown,
      "- a",
    );
    assert.equal(
      history.redo(),
      null,
    );
  },
);

test(
  "typing within the pause is one step; a pause or a command splits it",
  () => {
    const history = new EditHistory(state(""));
    history.record(
      state("a"),
      {
        typing: true,
        now: 0,
      },
    );
    history.record(
      state("ab"),
      {
        typing: true,
        now: 500,
      },
    );
    history.record(
      state("abc"),
      {
        typing: true,
        now: 900,
      },
    );
    history.record(
      state("abc d"),
      {
        typing: true,
        now: 2500,
      },
    );
    history.record(
      state("- abc d"),
      {
        now: 2600,
      },
    );
    history.record(
      state("- abc de"),
      {
        typing: true,
        now: 2700,
      },
    );
    assert.deepEqual(
      [
        history.undo(),
        history.undo(),
        history.undo(),
        history.undo(),
      ].map(
        (step) => step?.markdown,
      ),
      [
        "- abc d",
        "abc d",
        "abc",
        "",
      ],
    );
  },
);

test(
  "a new change clears redo, unchanged Markdown records no step",
  () => {
    const history = new EditHistory(state(""));
    history.record(
      state("a"),
      {
        now: 0,
      },
    );
    history.undo();
    history.record(
      state("b"),
      {
        now: 10,
      },
    );
    assert.equal(
      history.redo(),
      null,
    );
    history.record(
      state(
        "b",
        1,
      ),
      {
        now: 20,
      },
    );
    assert.equal(
      history.undo().markdown,
      "",
    );
  },
);

test(
  "the caret of the current state is what undo returns to",
  () => {
    const history = new EditHistory(state("abc"));
    history.updateSelection(
      {
        start: 2,
        end: 2,
      },
    );
    history.record(
      state("- abc"),
      {
        now: 0,
      },
    );
    assert.deepEqual(
      history.undo().selection,
      {
        start: 2,
        end: 2,
      },
    );
  },
);

test(
  "history keeps the latest 100 steps",
  () => {
    const history = new EditHistory(state("0"));
    for (let step = 1; step <= 150; step += 1) {
      history.record(
        state(String(step)),
        {
          now: step,
        },
      );
    }
    let last;
    for (let next = history.undo(); next; next = history.undo()) {
      last = next;
    }
    assert.equal(
      last.markdown,
      "50",
    );
  },
);
