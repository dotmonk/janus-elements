const matchesVariableWithQuoutes = (input) => {
  return input.length >= 3 && input[0] === "\"" && typeof input[1] === "number" && input[2] === "\"";
};

const propNameTerminators = [
  "\t",
  "\n",
  " ",
  ">",
  "=",
];
const propTerminators = [
  "\t",
  "\n",
  " ",
  ">",
];

export default (input) => {
  let index = 0;
  while (
    index + 1 < input.length &&
    !propNameTerminators.includes(input[index + 1])
  ) {
    index += 1;
  }
  const propName = input.slice(
    0,
    index + 1,
  ).join("");
  if (input[index + 1] === "=") {
    input = input.slice(index + 2);
    index = 0;
    if (typeof input[index] === "number") {
      return {
        props: {
          [propName]: input[index],
        },
        rest: input.slice(1),
      };
    } else if (matchesVariableWithQuoutes(input)) {
      return {
        props: {
          [propName]: input[index + 1],
        },
        rest: input.slice(3),
      };
    } else if (input[index] === "\"") {
      input = input.slice(index + 1);
      index = 0;
      let value = "";
      while (input[index] !== "\"") {
        if (index >= input.length) {
          throw Error(`Parse error. Unterminated value for attribute ${propName}`);
        }
        if (typeof input[index] === "number") {
          throw Error(`Parse error. Invalid attribute: ${input.slice(index).join("")}"`);
        }
        if (
          input[index] === "\\" &&
          input[index + 1] === "\""
        ) {
          index += 1;
        }
        value += input[index];
        index += 1;
      }
      return {
        props: {
          [propName]: value,
        },
        rest: input.slice(index + 1),
      };
    }
    input = input.slice(index);
    index = 0;
    while (
      !propTerminators.includes(input[index]) &&
      index < input.length
    ) {
      index += 1;
      if (typeof input[index] === "number") {
        throw Error(`Parse error. Invalid attribute: ${input.slice(index).join("")}"`);
      }
    }
    return {
      props: {
        [propName]: input.slice(
          0,
          index,
        ).join(""),
      },
      rest: input.slice(index),
    };
  }
  return {
    props: {
      [propName]: true,
    },
    rest: input.slice(index + 1),
  };
};
