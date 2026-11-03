const expand = (...expansions) => {
  const bothIsObjects = (item1, item2) => typeof item1 === "object" && typeof item2 === "object" && !Array.isArray(item1) && !Array.isArray(item2);
  const filteredExpansions = expansions.filter(
    (e) => !!e,
  );
  if (filteredExpansions.length > 2) {
    return expand(
      expand(
        filteredExpansions[0],
        filteredExpansions[1],
      ),
      ...filteredExpansions.slice(2),
    );
  } else if (filteredExpansions.length === 1) {
    return filteredExpansions[0];
  } else if (filteredExpansions.length === 0) {
    return {};
  }
  const original = filteredExpansions[0];
  const expansion = filteredExpansions[1];
  if (!bothIsObjects(
    original,
    expansion,
  )) {
    throw Error("Can't expand non objects");
  }
  const target = Object.assign(
    {},
    original,
  );
  Object.keys(expansion).forEach(
    (key) => {
      if (bothIsObjects(
        expansion[key],
        original[key],
      )) {
        target[key] = expand(
          original[key],
          expansion[key],
        );
      } else {
        Object.assign(
          target,
          {
            [key]: expansion[key],
          },
        );
      }
    },
  );
  return target;
};

const forwardedProps = (props) => Object.fromEntries(Object.entries(props).filter(
  ([
    name,
    value,
  ]) => name !== "style" && typeof value !== "function",
));

export default {
  expand,
  forwardedProps,
};
