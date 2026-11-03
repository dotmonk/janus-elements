import Component, {
  type JanusProps,
  type JanusTemplateResult,
} from "../index.js";

export type JanusLocation = {
  pathname: string;
  hashPath: string;
  hashParams: Record<string, string>;
  searchParams: Record<string, string>;
};

export type RouteMatchOptions = {
  hashRegex?: RegExp | string | null;
  pathnameRegex?: RegExp | string | null;
  basename?: string;
};

export declare function pushPathname(pathname: string): void;
export declare function pushHash(hash: string): void;
export declare function subscribeLocation(listener: () => void): () => void;
export declare function parseLocation(loc?: Location): JanusLocation;
export declare function pathAfterBasename(pathname: string, basename?: string): string;
export declare function matchRoute(options?: RouteMatchOptions, loc?: Location): boolean;

export declare class Router extends Component {}

export declare class Location extends Component {

  props?: JanusProps & {
    render?: (location: JanusLocation) => JanusTemplateResult;
  };
}

export declare class Route extends Component {

  props?: JanusProps & RouteMatchOptions;
}

export {
  Route as default,
};
