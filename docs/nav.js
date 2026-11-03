export const DEFAULT_HASH = "/about";

export const hashRegex = (hash) => {
  if (
    !hash ||
    hash === "/" ||
    hash === DEFAULT_HASH
  ) {
    return /^\/?$|^\/about\/?$/;
  }
  const trimmed = hash.endsWith("/")
    ? hash.slice(
        0,
        -1,
      )
    : hash;
  const escaped = trimmed.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  return new RegExp(`^${escaped}/?$`);
};

export const normalizeDocsHash = (hashPath) => {
  if (
    !hashPath ||
    hashPath === "/"
  ) {
    return DEFAULT_HASH;
  }
  return hashPath.endsWith("/") && hashPath.length > 1
    ? hashPath.slice(
        0,
        -1,
      )
    : hashPath;
};

/** @type {Array<{ label: string, hash?: string, id?: string, children?: any[] }>} */
export const navTree = [
  {
    label: "About",
    hash: "/about",
  },
  {
    label: "Basics",
    hash: "/basics",
  },
  {
    label: "Helpers",
    hash: "/helpers",
  },
  {
    label: "Tooling",
    hash: "/tooling",
  },
  {
    label: "Examples",
    hash: "/examples",
  },
  {
    label: "Routing",
    hash: "/routing",
  },
  {
    label: "UI general",
    hash: "/ui/general",
  },
  {
    label: "Custom theme",
    hash: "/ui/custom-theme",
  },
  {
    label: "Buttons",
    hash: "/ui/buttons",
  },
  {
    label: "Badges",
    hash: "/ui/badges",
  },
  {
    label: "Inputs",
    hash: "/ui/inputs",
  },
  {
    label: "Code editor",
    hash: "/ui/code-editor",
  },
  {
    label: "Rich textarea",
    hash: "/ui/rich-textarea",
  },
  {
    label: "Date and time",
    hash: "/ui/date-time",
  },
  {
    label: "Form controls",
    hash: "/ui/form-controls",
  },
  {
    label: "Feedback",
    hash: "/ui/feedback",
  },
  {
    label: "Navigation and layout",
    hash: "/ui/navigation-layout",
  },
  {
    label: "Data display",
    hash: "/ui/data",
  },
  {
    label: "Select",
    hash: "/ui/select",
  },
  {
    label: "Panels",
    hash: "/ui/panels",
  },
  {
    label: "Spinners",
    hash: "/ui/spinners",
  },
  {
    label: "Icons",
    hash: "/ui/icons",
  },
  {
    label: "Tooltip",
    hash: "/ui/tooltip",
  },
  {
    label: "Modals",
    hash: "/ui/modals",
  },
];

const walk = (nodes, visit) => {
  for (const node of nodes) {
    visit(node);
    if (node.children) {
      walk(
        node.children,
        visit,
      );
    }
  }
};

export const leafHashes = (() => {
  const hashes = [];
  walk(
    navTree,
    (node) => {
      if (node.hash) {
        hashes.push(node.hash);
      }
    },
  );
  return hashes;
})();

export const ancestorsOfHash = (hashPath) => {
  const target = normalizeDocsHash(hashPath);
  const path = [];

  const search = (nodes, trail) => {
    for (const node of nodes) {
      if (node.hash === target) {
        path.push(...trail);
        return true;
      }
      if (node.children) {
        if (search(
          node.children,
          [
            ...trail,
            node.id,
          ],
        )) {
          return true;
        }
      }
    }
    return false;
  };

  search(
    navTree,
    [],
  );
  return path;
};
