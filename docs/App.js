import Component, {
  html,
} from "janus-elements";
import "janus-elements/ui";
import SunIcon from "janus-elements/ui/icons/sun";
import MoonIcon from "janus-elements/ui/icons/moon";
import DayNightIcon from "janus-elements/ui/icons/day-night";
import MenuIcon from "janus-elements/ui/icons/menu";
import ExportIcon from "janus-elements/ui/icons/export";
import {
  sectionForHash,
} from "./sections/index.js?v=13";
import {
  normalizeDocsHash,
} from "./nav.js";
import {
  applyDocsTheme,
  downloadThemeCss,
  ensureDocsThemes,
  getActiveDocsTheme,
  getThemeOptions,
  subscribeThemes,
} from "./themes.js";

import "./Logo.js";
import "./SideNav.js";

const DOCS_MAIN_SCROLL = "docs-main-scroll";

const modeOptions = [
  {
    name: "System mode",
    value: "system",
  },
  {
    name: "Day mode",
    value: "light",
  },
  {
    name: "Night mode",
    value: "dark",
  },
];

const modeIconForMode = {
  light: SunIcon,
  dark: MoonIcon,
  system: DayNightIcon,
};

const modeOptionIcon = (value) => {
  if (value === "light") {
    return html`
      <SunIcon size=${16} />
    `;
  }
  if (value === "dark") {
    return html`
      <MoonIcon size=${16} />
    `;
  }
  return html`
    <DayNightIcon size=${16} />
  `;
};

const modeOptionLabel = (option) => html`
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
    }}
  >${modeOptionIcon(option.value)}${option.name}</span>
`;

const themeAccentSwatch = (option) => html`
  <span
    aria-hidden="true"
    style=${{
      display: "inline-flex",
      width: "16px",
      height: "16px",
      boxSizing: "border-box",
      borderRadius: "3px",
      border: "1px solid var(--janus-border)",
      overflow: "hidden",
      flexShrink: "0",
      lineHeight: "0",
    }}
  >
    <span
      style=${{
        flex: "1",
        backgroundColor: option.lightAccent,
      }}
    />
    <span
      style=${{
        flex: "1",
        backgroundColor: option.darkAccent,
      }}
    />
  </span>
`;

const themeOptionLabel = (option) => html`
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      height: "16px",
      fontSize: "0.875rem",
      lineHeight: "16px",
    }}
  >
    ${themeAccentSwatch(option)}
    <span
      style=${{
        lineHeight: "16px",
      }}
    >${option.name}</span>
  </span>
`;

const MOBILE_QUERY = "(max-width: 767px)";

class App extends Component {

  constructor() {
    super();
    this.state = {
      mode: "system",
      theme: "default",
      sidebarCollapsed: false,
      mobileOpen: false,
      isMobile: false,
    };
    this._onResize = () => {
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const mobileOpen = isMobile
        ? this.state.mobileOpen
        : false;
      this.syncBodyScroll(mobileOpen);
      this.setState(
        {
          isMobile,
          mobileOpen,
        },
      );
    };
    this._onKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        this.state.mobileOpen
      ) {
        this.closeMobileNav();
      }
    };
  }

  syncBodyScroll(mobileOpen) {
    document.body.style.overflow = mobileOpen
      ? "hidden"
      : "";
  }

  openMobileNav() {
    this.syncBodyScroll(true);
    this.setState(
      {
        mobileOpen: true,
      },
    );
  }

  closeMobileNav() {
    this.syncBodyScroll(false);
    this.setState(
      {
        mobileOpen: false,
      },
    );
  }

  setTheme(theme) {
    applyDocsTheme(theme);
    this.setState(
      {
        theme,
      },
    );
  }

  renderDocsSection(location) {
    const hashPath = normalizeDocsHash(location.hashPath);
    if (this._docsHash !== hashPath) {
      this._docsHash = hashPath;
      queueMicrotask(
        () => {
          const scroller = document.querySelector(`.${DOCS_MAIN_SCROLL}`);
          if (scroller) {
            scroller.scrollTop = 0;
          }
        },
      );
    }
    return sectionForHash(hashPath);
  }

  componentDidMount() {
    ensureDocsThemes();
    applyDocsTheme(this.state.theme);
    this._unsubscribeThemes = subscribeThemes(
      () => {
        this.setState(
          {
            theme: getActiveDocsTheme(),
          },
        );
      },
    );
    this._onResize();
    window.addEventListener(
      "resize",
      this._onResize,
    );
    window.addEventListener(
      "keydown",
      this._onKeyDown,
    );
  }

  componentWillUnmount() {
    this._unsubscribeThemes && this._unsubscribeThemes();
    window.removeEventListener(
      "resize",
      this._onResize,
    );
    window.removeEventListener(
      "keydown",
      this._onKeyDown,
    );
    document.body.style.overflow = "";
  }

  render() {
    const {
      mode,
      theme,
      sidebarCollapsed,
      mobileOpen,
      isMobile,
    } = this.state;
    const showSidebar = isMobile
      ? mobileOpen
      : !sidebarCollapsed;
    const themeOptions = getThemeOptions();

    return html`
      <div
        style=${{
          position: "fixed",
          inset: "0",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--janus-bg)",
        }}
      >
        <BaseTheme mode=${mode} />
        <header
          style=${{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--janus-border)",
            backgroundColor: "var(--janus-surface)",
            flexShrink: "0",
          }}
        >
          <Button
            aria-label=${isMobile
              ? mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              : sidebarCollapsed
              ? "Expand navigation"
              : "Collapse navigation"}
            aria-expanded=${showSidebar
              ? "true"
              : "false"}
            headIcon=${MenuIcon}
            onClick=${() => {
              if (isMobile) {
                mobileOpen
                  ? this.closeMobileNav()
                  : this.openMobileNav();
              } else {
                this.setState(
                  {
                    sidebarCollapsed: !sidebarCollapsed,
                  },
                );
              }
            }}
          />
          <div
            style=${{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Logo size=${28} />
            <strong
              style=${{
                fontSize: "1.125rem",
              }}
            >Janus Elements</strong>
          </div>
          <div
            style=${{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            <Select
              aria-label="Mode"
              options=${modeOptions}
              value=${mode}
              headIcon=${modeIconForMode[mode] || DayNightIcon}
              renderOption=${modeOptionLabel}
              onChange=${(selectedMode) => this.setState(
                {
                  mode: selectedMode,
                },
              )}
            />
            <Select
              aria-label="Theme"
              searchable=${false}
              options=${themeOptions}
              value=${theme}
              renderOption=${themeOptionLabel}
              renderValue=${themeOptionLabel}
              onChange=${(selectedTheme) => this.setTheme(selectedTheme)}
            />
            <Button
              aria-label="Export CSS"
              headIcon=${ExportIcon}
              onClick=${() => downloadThemeCss(getActiveDocsTheme())}
            />
          </div>
        </header>
        <div
          style=${{
            display: "flex",
            flexGrow: "1",
            minHeight: "0",
            position: "relative",
          }}
        >
          ${isMobile && mobileOpen
            ? html`
                <div
                  style=${{
                    position: "absolute",
                    inset: "0",
                    backgroundColor: "rgba(0, 0, 0, 0.35)",
                    zIndex: "1",
                  }}
                  onClick=${() => this.closeMobileNav()}
                />
              `
            : html``}
          <aside
            style=${{
              display: showSidebar
                ? "flex"
                : "none",
              flexDirection: "column",
              width: isMobile
                ? "100%"
                : "240px",
              flexShrink: "0",
              borderRight: isMobile
                ? "none"
                : "1px solid var(--janus-border)",
              backgroundColor: "var(--janus-surface)",
              position: isMobile
                ? "absolute"
                : "relative",
              inset: isMobile
                ? "0"
                : "auto",
              zIndex: isMobile
                ? "2"
                : "0",
            }}
          >
            <SideNav onNavigate=${() => this.closeMobileNav()} />
          </aside>
          <Panel
            style=${{
              display: "flex",
              flexDirection: "column",
              flexGrow: "1",
              flexShrink: "1",
              minHeight: "0",
              margin: "0",
              padding: "0",
              borderRadius: "0",
              border: "none",
            }}
          >
            <div
              class=${DOCS_MAIN_SCROLL}
              style=${{
                flexGrow: "1",
                minHeight: "0",
                overflow: "auto",
              }}
            >
              <div
                class="docs-content"
                style=${{
                  padding: "16px 20px",
                }}
              >
                <Location render=${(location) => this.renderDocsSection(location)} />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    `;
  }
}

Component.register(App);
