import parser from "./parser.js";
import render from "./render.js";
import createTemplateFunction from "./createTemplateFunction.js";

const templateStore = {};

const tagStringsToKey = (strings) => strings.join("\0");

const flattenChildren = (content) => {
  if (Array.isArray(content)) {
    let children = [];
    content.forEach(
      (c) => children = children.concat(flattenChildren(c)),
    );
    return children;
  }
  return [
    content,
  ];
};

const taggedLiteral = (strings, ...values) => {
  const storeKey = tagStringsToKey(strings);
  if (!templateStore.hasOwnProperty(storeKey)) {
    const parseList = strings.reduce(
      (list, str, index) => {
        list = list.concat(str.split(""));
        values.length > index && list.push(index);
        return list;
      },
      [],
    );

    const result = parser(parseList);
    const templateFunction = createTemplateFunction(result.contents);
    templateStore[storeKey] = templateFunction;
  }
  return templateStore[storeKey](values);
};

export {
  render,
  flattenChildren,
};

export default taggedLiteral;
