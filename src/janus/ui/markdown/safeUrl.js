/** Allow http(s), mailto, hash, and relative URLs; strip dangerous schemes. */
export const safeUrl = (url) => {
  const value = String(url == null
    ? ""
    : url).trim();
  if (!value) {
    return "";
  }
  if (/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(value)) {
    return value;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return "";
  }
  return value;
};
