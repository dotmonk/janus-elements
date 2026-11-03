declare const util: {
  expand(...expansions: Record<string, unknown>[]): Record<string, unknown>;
  forwardedProps(props: Record<string, unknown>): Record<string, unknown>;
};

export default util;
