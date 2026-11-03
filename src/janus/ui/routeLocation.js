export function parseLocation(loc = globalThis.location) {
  const hash = loc.hash
    ? loc.hash.substring(1)
    : "";
  const queryAt = hash.indexOf("?");
  const hashPath = queryAt >= 0
    ? hash.slice(
        0,
        queryAt,
      )
    : hash;
  const hashParams = queryAt >= 0
    ? Object.fromEntries(new URLSearchParams(hash.slice(queryAt + 1)))
    : {};
  const searchParams = Object.fromEntries(new URLSearchParams(loc.search || ""));

  return {
    pathname: loc.pathname || "",
    hashPath,
    hashParams,
    searchParams,
  };
}

export function pathAfterBasename(pathname, basename = "") {
  if (!basename) {
    return pathname || "/";
  }

  const base = basename.endsWith("/")
    ? basename.slice(
        0,
        -1,
      )
    : basename;
  if (
    pathname === base ||
    pathname === `${base}/`
  ) {
    return "/";
  }
  if (pathname.startsWith(`${base}/`)) {
    const rest = pathname.slice(base.length);
    return rest || "/";
  }
  return pathname || "/";
}

export function matchRoute({
  hashRegex,
  pathnameRegex,
  basename,
} = {}, loc = globalThis.location) {
  const {
    pathname,
    hashPath,
  } = parseLocation(loc);
  const path = pathAfterBasename(
    pathname,
    basename,
  );
  const activeByPathname = pathnameRegex && path.match(pathnameRegex);
  const activeByHash = hashRegex && hashPath.match(hashRegex);
  return Boolean(activeByPathname || activeByHash);
}
