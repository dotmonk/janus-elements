import parser from "./parser.js";
import parseProp from "./parseProp.js";

export default (input) => {
  if (
    input.length < 4 ||
    (
      typeof input[1] === "string" &&
      !input[1].match(/[a-zA-Z]{1}/)
    )
  ) {
    //minimum possible pattern is <a/> else error, two first characters must be <[letter]
    throw Error(`Parse error on ${input.slice(0, 4).join("")}`);
  }
  let index = 2;
  let tagName = undefined;
  const propModifiers = [];
  let props = {};
  let bodyLess = false;
  const _children = [];

  while (
    index < input.length &&
    typeof input[index] === "string" &&
    input[index].match(/[a-zA-Z0-9-]{1}/)
  ) {
    index += 1;
  }

  if (index === input.length) {
    throw Error(`Parse error on getting tag name from ${input.join("")}`);
  }
  tagName = input.slice(
    1,
    index,
  ).join("");
  input = input.slice(index);
  index = 0;

  do {
    if (typeof input[index] === "number") {
      propModifiers.push(input[index]);
    } else if (
      typeof input[index] === "string" &&
      input[index].match(/[a-zA-Z0-9-]{1}/)
    ) {
      const parsePropResult = parseProp(input.slice(index));
      Object.assign(
        props,
        parsePropResult.props,
      );
      input = parsePropResult.rest;
      index = -1;
    } else if (
      input[index] === "/" &&
      input[index + 1] === ">"
    ) {
      bodyLess = true;
      index += 1;
    }
    index += 1;
  } while (
    index < input.length &&
    input[index - 1] !== ">"
  );

  if (input[index - 1] !== ">") {
    throw Error(`Parse error. Couldn't find end of ${tagName} tag`);
  }
  if (!bodyLess) {
    const parserResult = parser(
      input.slice(index),
      tagName,
    );
    return {
      contents: [
        {
          props,
          propModifiers,
          contents: parserResult.contents,
          tagName: tagName,
        },
      ],
      rest: parserResult.rest,
    };
  }
  //OOooh I ain't got no boooody
  return {
    contents: [
      {
        props,
        propModifiers,
        contents: [],
        tagName: tagName,
      },
    ],
    rest: input.slice(index),
  };
};
