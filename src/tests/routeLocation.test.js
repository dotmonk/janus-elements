import {
  describe,
  test,
} from "node:test";
import assert from "node:assert/strict";

import {
  matchRoute,
  parseLocation,
  pathAfterBasename,
} from "../janus/ui/routeLocation.js";

const loc = ({
  pathname = "/",
  hash = "",
  search = "",
} = {}) => ({
  pathname,
  hash,
  search,
});

describe(
  "parseLocation",
  () => {
    test(
      "empty hash",
      () => {
        assert.deepEqual(
          parseLocation(loc()),
          {
            pathname: "/",
            hashPath: "",
            hashParams: {},
            searchParams: {},
          },
        );
      },
    );

    test(
      "hash path and params",
      () => {
        assert.deepEqual(
          parseLocation(loc(
            {
              hash: "#/library?tab=props",
            },
          )),
          {
            pathname: "/",
            hashPath: "/library",
            hashParams: {
              tab: "props",
            },
            searchParams: {},
          },
        );
      },
    );

    test(
      "search params",
      () => {
        assert.deepEqual(
          parseLocation(loc(
            {
              search: "?q=janus&x=1",
            },
          )).searchParams,
          {
            q: "janus",
            x: "1",
          },
        );
      },
    );
  },
);

describe(
  "pathAfterBasename",
  () => {
    test(
      "no basename",
      () => {
        assert.equal(
          pathAfterBasename("/docs/library"),
          "/docs/library",
        );
      },
    );

    test(
      "strips basename to root",
      () => {
        assert.equal(
          pathAfterBasename(
            "/docs",
            "/docs",
          ),
          "/",
        );
        assert.equal(
          pathAfterBasename(
            "/docs/",
            "/docs",
          ),
          "/",
        );
        assert.equal(
          pathAfterBasename(
            "/janus-elements/",
            "/janus-elements",
          ),
          "/",
        );
      },
    );

    test(
      "strips basename to remainder",
      () => {
        assert.equal(
          pathAfterBasename(
            "/docs/library",
            "/docs",
          ),
          "/library",
        );
        assert.equal(
          pathAfterBasename(
            "/janus-elements/ui-kit",
            "/janus-elements",
          ),
          "/ui-kit",
        );
      },
    );
  },
);

describe(
  "matchRoute",
  () => {
    test(
      "hash only",
      () => {
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/library\/?$/,
            },
            loc(
              {
                hash: "#/library",
              },
            ),
          ),
          true,
        );
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/library\/?$/,
            },
            loc(
              {
                hash: "#/",
              },
            ),
          ),
          false,
        );
      },
    );

    test(
      "empty hash matches home",
      () => {
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/?$/,
            },
            loc(
              {
                hash: "",
              },
            ),
          ),
          true,
        );
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/?$/,
            },
            loc(
              {
                hash: "#",
              },
            ),
          ),
          true,
        );
      },
    );

    test(
      "pathname only with basename",
      () => {
        assert.equal(
          matchRoute(
            {
              pathnameRegex: /^\/library\/?$/,
              basename: "/docs",
            },
            loc(
              {
                pathname: "/docs/library",
              },
            ),
          ),
          true,
        );
        assert.equal(
          matchRoute(
            {
              pathnameRegex: /^\/library\/?$/,
              basename: "/docs",
            },
            loc(
              {
                pathname: "/docs/",
              },
            ),
          ),
          false,
        );
      },
    );

    test(
      "either hash or pathname is enough",
      () => {
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/ui-kit\/?$/,
              pathnameRegex: /^\/ui-kit\/?$/,
              basename: "/docs",
            },
            loc(
              {
                pathname: "/docs/",
                hash: "#/ui-kit",
              },
            ),
          ),
          true,
        );
        assert.equal(
          matchRoute(
            {
              hashRegex: /^\/ui-kit\/?$/,
              pathnameRegex: /^\/ui-kit\/?$/,
              basename: "/docs",
            },
            loc(
              {
                pathname: "/docs/ui-kit",
                hash: "",
              },
            ),
          ),
          true,
        );
      },
    );

    test(
      "neither regex means no match",
      () => {
        assert.equal(
          matchRoute(
            {},
            loc(
              {
                pathname: "/docs/",
                hash: "#/",
              },
            ),
          ),
          false,
        );
      },
    );
  },
);
