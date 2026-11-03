import Component, {
  html,
} from "../index.js";
import {
  matchRoute,
  parseLocation,
  pathAfterBasename,
} from "./routeLocation.js";

const dispatchPushState = () => {
  window.dispatchEvent(new Event(
    "pushstate",
    {
      bubbles: true,
    },
  ));
};

export function pushPathname(pathname) {
  history.pushState(
    undefined,
    document.title,
    pathname,
  );
  dispatchPushState();
}

export function pushHash(hash) {
  const normalized = String(hash).startsWith("#")
    ? String(hash).slice(1)
    : String(hash);
  history.pushState(
    undefined,
    document.title,
    `${window.location.pathname}#${normalized}`,
  );
  dispatchPushState();
}

export function subscribeLocation(listener) {
  window.addEventListener(
    "popstate",
    listener,
  );
  window.addEventListener(
    "pushstate",
    listener,
  );
  return () => {
    window.removeEventListener(
      "popstate",
      listener,
    );
    window.removeEventListener(
      "pushstate",
      listener,
    );
  };
}

export {
  parseLocation,
  pathAfterBasename,
  matchRoute,
};

const contents = (children) => html`
  <div
    style=${{
      display: "contents",
    }}
  >${children}</div>
`;

const withLocationSubscription = (Base) => {
  class LocationSubscribed extends Base {

    componentDidMount() {
      this._unsubscribe = subscribeLocation(this._onLocation);
    }

    componentWillUnmount() {
      this._unsubscribe && this._unsubscribe();
    }
  }

  return LocationSubscribed;
};

class Router extends withLocationSubscription(Component) {

  constructor() {
    super();
    this.state = parseLocation();
    this._onLocation = () => this.setState(parseLocation());
  }

  render() {
    return contents(this.childElements);
  }
}

class Location extends withLocationSubscription(Component) {

  constructor() {
    super();
    this.state = {
      location: parseLocation(),
    };
    this._onLocation = () => this.setState(
      {
        location: parseLocation(),
      },
    );
  }

  render() {
    const {
      render: renderLocation,
    } = this.props || {};
    if (typeof renderLocation !== "function") {
      return html``;
    }
    return contents(renderLocation(this.state.location));
  }
}

class Route extends withLocationSubscription(Component) {

  constructor() {
    super();
    this.state = {
      generation: 0,
    };
    this._onLocation = () => this.setState(
      {
        generation: this.state.generation + 1,
      },
    );
  }

  render() {
    const {
      hashRegex,
      pathnameRegex,
      basename,
    } = this.props || {};
    if (!matchRoute(
      {
        hashRegex,
        pathnameRegex,
        basename,
      },
    )) {
      return html``;
    }
    return contents(this.childElements);
  }
}

Component.register(Router);
Component.register(Location);
Component.register(Route);

export {
  Router,
  Location,
  Route,
};
export default Route;
