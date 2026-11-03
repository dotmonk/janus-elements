import {
  test,
} from "node:test";
import assert from "node:assert/strict";
import {
  calendarCells,
  formatDisplayDate,
  formatISODate,
  formatISOTime,
  formatISOWeek,
  getMonthNames,
  isoWeekParts,
  parseISODate,
  parseISOTime,
  parseISOWeek,
  formatTemplate,
  resolveLocale,
  shiftISODate,
} from "../janus/ui/dateTime.js";

test(
  "parse and format ISO dates",
  () => {
    assert.deepEqual(
      parseISODate("2026-10-28"),
      {
        year: 2026,
        month: 10,
        day: 28,
      },
    );
    assert.equal(
      formatISODate(
        2026,
        10,
        28,
      ),
      "2026-10-28",
    );
    assert.equal(
      parseISODate("2026-13-01"),
      null,
    );
  },
);

test(
  "parse and format ISO times",
  () => {
    assert.deepEqual(
      parseISOTime("14:30"),
      {
        hour: 14,
        minute: 30,
        second: 0,
        hasSeconds: false,
      },
    );
    assert.equal(
      formatISOTime(
        9,
        5,
        0,
        false,
      ),
      "09:05",
    );
    assert.equal(
      formatISOTime(
        9,
        5,
        7,
        true,
      ),
      "09:05:07",
    );
  },
);

test(
  "ISO week round-trips",
  () => {
    const parts = isoWeekParts(
      2026,
      10,
      28,
    );
    assert.equal(
      formatISOWeek(
        parts.weekYear,
        parts.week,
      ),
      "2026-W44",
    );
    assert.deepEqual(
      parseISOWeek("2026-W44"),
      {
        weekYear: 2026,
        week: 44,
      },
    );
  },
);

test(
  "calendar cells fill complete weeks",
  () => {
    const weeks = calendarCells(
      2026,
      10,
      1,
      null,
      null,
    );
    assert.ok(weeks.length >= 5);
    assert.equal(
      weeks[0].length,
      7,
    );
    assert.ok(weeks.flat().some(
      (cell) => cell.iso === "2026-10-15" && cell.inMonth,
    ));
  },
);

test(
  "shiftISODate moves by day deltas",
  () => {
    assert.equal(
      shiftISODate(
        "2026-10-28",
        3,
      ),
      "2026-10-31",
    );
    assert.equal(
      shiftISODate(
        "2026-10-28",
        4,
      ),
      "2026-11-01",
    );
  },
);

test(
  "formatTemplate replaces named placeholders",
  () => {
    assert.equal(
      formatTemplate(
        "Start {date} — pick end",
        {
          date: "Oct 10, 2026",
        },
      ),
      "Start Oct 10, 2026 — pick end",
    );
    assert.equal(
      formatTemplate(
        "{year}v{week}",
        {
          year: 2026,
          week: 44,
        },
      ),
      "2026v44",
    );
    assert.equal(
      formatTemplate(
        "Week {week}",
        {
          week: 7,
        },
      ),
      "Week 7",
    );
    assert.equal(
      formatTemplate(
        "Wk",
        {},
      ),
      "Wk",
    );
  },
);

test(
  "resolveLocale defaults to en-US and ignores the browser language",
  () => {
    const previous = globalThis.navigator;
    Object.defineProperty(
      globalThis,
      "navigator",
      {
        configurable: true,
        value: {
          language: "sv-SE",
        },
      },
    );
    try {
      assert.equal(
        resolveLocale(undefined),
        "en-US",
      );
      assert.equal(
        resolveLocale(""),
        "en-US",
      );
      assert.equal(
        resolveLocale("sv-SE"),
        "sv-SE",
      );
      assert.equal(
        getMonthNames(undefined)[9],
        "October",
      );
      assert.equal(
        formatDisplayDate(
          "2026-10-28",
          undefined,
        ),
        "Oct 28, 2026",
      );
      assert.match(
        getMonthNames("sv-SE")[9],
        /oktober/i,
      );
    } finally {
      if (previous === undefined) {
        delete globalThis.navigator;
      } else {
        Object.defineProperty(
          globalThis,
          "navigator",
          {
            configurable: true,
            value: previous,
          },
        );
      }
    }
  },
);
