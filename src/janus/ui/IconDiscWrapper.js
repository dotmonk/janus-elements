import Component, {
  html,
} from "../index.js";

import iconWrapperStyle from "./iconWrapperStyle.js";
import util from "./util.js";

class IconDiscWrapper extends Component {

  render() {
    const props = this.props || {};
    const style = iconWrapperStyle(
      props,
      "50%",
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

Component.register(IconDiscWrapper);
