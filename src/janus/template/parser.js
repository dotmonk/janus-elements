import parseTag from "./parseTag.js";

const startsTag = (input, index) => input[index] === "<" && typeof input[index + 1] === "string" && /[a-zA-Z/!]/.test(input[index + 1]);

export default (input, endTag) => {
  const result = {
    contents: [],
    rest: [],
  };

  let index = 0;

  do {
    const hasString = index > 0;
    const currentToken = input[index];
    const type = typeof currentToken;
    const isTag = startsTag(
      input,
      index,
    );
    const isVariable = type === "number";

    if (
      (
        isTag ||
        isVariable ||
        index === input.length
      ) &&
      hasString
    ) {
      result.contents.push(input.slice(
        0,
        index,
      ).join(""));
      input = input.slice(index);
      index = 0;
    }
    if (isVariable) {
      result.contents.push(currentToken);
      input = input.slice(1);
    } else if (isTag) {
      if (
        endTag &&
        input[index + 1] === "/"
      ) {
        if (`${input.slice(index + 2, index + 3 + endTag.length).join("")}` !== `${endTag}>`) {
          throw Error(`Parse error. Invalid end tag, expected "</${endTag}>" found "${input.slice(index).join("")}"`);
        }
        result.rest = input.slice(index + 3 + endTag.length);
        return result;
      } else {
        const tagParseResult = parseTag(input);
        result.contents = result.contents.concat(tagParseResult.contents);
        input = tagParseResult.rest;
        index = 0;
      }
    } else {
      index += 1;
    }
  } while (index <= input.length);

  if (endTag) {
    throw Error(`Parse error. Missing end tag "</${endTag}>"`);
  }
  return result;
};
