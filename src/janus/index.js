import Component from "./Component.js";
import html, {
  render,
} from "./template/index.js";

export const camelToKebab = (name) => name.replace(
  /([A-Z])/g,
  (match) => "-" + match.toLowerCase(),
);

export {
  html,
  render,
};
export default Component;
