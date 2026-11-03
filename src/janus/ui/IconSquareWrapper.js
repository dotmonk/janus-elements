import Component, {
  html,
} from "../index.js";

import iconWrapperStyle from "./iconWrapperStyle.js";
import util from "./util.js";

class IconSquareWrapper extends Component {

  render() {
    const props = this.props || {};
    const style = iconWrapperStyle(
      props,
      "var(--janus-radius)",
    );
    const forwarded = util.forwardedProps(props);
    delete forwarded.color;
    delete forwarded.size;
    delete forwarded.outline;

    return html`
      <span
        style=${style}
        ${forwarded}
      >${this.childElements}</span>
    `;
  }
}

Component.register(IconSquareWrapper);
