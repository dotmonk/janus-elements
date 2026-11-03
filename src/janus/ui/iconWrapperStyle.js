import theme from "./theme.js";

const iconWrapperStyle = (props, borderRadius) => {
  const {
    size = 24,
    color,
    outline,
  } = props || {};
  const tone = theme.tone(color);
  const filled = !outline;
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: "0",
    borderRadius,
    borderWidth: outline
      ? "1.5px"
      : "0",
    borderStyle: "solid",
    borderColor: outline
      ? tone
      : "transparent",
    backgroundColor: filled
      ? theme.mix(
          tone,
          12,
        )
      : "transparent",
    color: tone,
    overflow: "hidden",
    lineHeight: "0",
  };
};

export default iconWrapperStyle;
