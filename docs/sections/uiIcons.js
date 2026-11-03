import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const caption = (label) => html`
  <span
    style=${{
      fontSize: "0.75rem",
      color: "var(--janus-text-muted)",
    }}
  >${label}</span>
`;

const cell = (label, content) => html`
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "12px",
      marginBottom: "8px",
    }}
  >${content}${caption(label)}</span>
`;

const snippet = `<EditIcon />
<EditIcon animated />
<HeartIcon color="error" />
<ClockIcon />
<CalendarIcon animated />
<KeyIcon color="accent" />
<FileIcon />
<FolderIcon />
<DownloadIcon />
<UploadIcon />
<ExportIcon />
<CopyIcon />
<LinkIcon />
<InfoIcon />
<FilterIcon />
<RefreshIcon animated />
<ImageIcon />
<MapPinIcon />
<PhoneIcon />
<BookmarkIcon />
<MessageIcon />
<CloudIcon />
<EyeOffIcon />
<UnlockIcon />
<MarkdownIcon />
<SunIcon />
<MoonIcon />
<DayNightIcon animated />
<CharactersIcon text="MW" color="accent" />
<CharactersIcon text="🡪" size=\${28} />
<CharactersIcon text="⚠" color="warning" animated />
<IconTriangleWrapper size=\${40} color="warning">
  <CharactersIcon text="⚠" />
</IconTriangleWrapper>
<IconTriangleWrapper size=\${40} color="warning" outline>
  <CharactersIcon text="⚠" />
</IconTriangleWrapper>
<IconDiscWrapper size=\${40} color="accent" outline>
  <CharactersIcon text="MW" />
</IconDiscWrapper>
<IconSquareWrapper size=\${40} color="info">
  <UserIcon size=\${20} />
</IconSquareWrapper>`;

const iconRow = (animated) => html`
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <SearchIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Search</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <MenuIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Menu</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CloseIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Close</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <HomeIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Home</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <UserIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >User</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <SettingsIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Settings</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CartIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Cart</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <HeartIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Heart</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <BellIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Bell</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <ChevronIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Chevron</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CheckIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Check</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <PlusIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Plus</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <TrashIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Trash</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <EditIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Edit</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <ShareIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Share</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <StarIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Star</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <LockIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Lock</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <EyeIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Eye</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <EnvelopeIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Envelope</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <PlayIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Play</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <ClockIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Clock</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CalendarIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Calendar</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <KeyIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Key</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <FileIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >File</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <FolderIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Folder</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <DownloadIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Download</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <UploadIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Upload</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <ExportIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Export</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CopyIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Copy</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <LinkIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Link</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <InfoIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Info</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <FilterIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Filter</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <RefreshIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Refresh</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <ImageIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Image</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <MapPinIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >MapPin</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <PhoneIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Phone</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <BookmarkIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Bookmark</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <MessageIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Message</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <CloudIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Cloud</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <EyeOffIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >EyeOff</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <UnlockIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Unlock</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <MarkdownIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Markdown</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <SunIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Sun</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <MoonIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >Moon</span>
  </span>
  <span
    style=${{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      marginRight: "10px",
    }}
  >
    <DayNightIcon
      color="accent"
      animated=${animated}
    />
    <span
      style=${{
        fontSize: "0.75rem",
        color: "var(--janus-text-muted)",
      }}
    >DayNight</span>
  </span>
`;

class DocsUiIcons extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Icons</h2>
        <p
          style=${{
            margin: "0 0 12px",
            color: "var(--janus-text-muted)",
          }}
        >
          Line-art icons use
          <code>currentColor</code>
          and the kit
          <code>color</code>
          tones. Pass
          <code>animated</code>
          for the animated variant (CSS keyframes; SMIL for the DayNight phase cycle); reduced-motion preferences keep the static file.
        </p>
        <p
          style=${{
            margin: "0 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Static</p>
        <div style=${rowStyle}>${iconRow(false)}</div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Animated</p>
        <div style=${rowStyle}>${iconRow(true)}</div>
        <h3
          style=${{
            margin: "28px 0 8px",
            fontSize: "1.1rem",
          }}
        >Characters icon</h3>
        <p
          style=${{
            margin: "0 0 12px",
            color: "var(--janus-text-muted)",
          }}
        >
          <code>CharactersIcon</code>
          renders initials or UTF-8 glyphs via
          <code>text</code>
          (or children). Pass
          <code>animated</code>
          for a pulse (honours reduced motion). Wrap with disc, square, or triangle shells;
          <code>outline</code>
          draws a stroked shell instead of a fill.
        </p>
        <p
          style=${{
            margin: "0 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Initials and status</p>
        <div style=${rowStyle}>${cell(
            "Initials",
            html`
              <CharactersIcon
                text="MW"
                color="accent"
                size=${32}
              />
            `,
          )}${cell(
            "Star",
            html`
              <CharactersIcon size=${32}>★</CharactersIcon>
            `,
          )}${cell(
            "Pulse",
            html`
              <CharactersIcon
                text="●"
                color="error"
                size=${32}
                animated=${true}
              />
            `,
          )}</div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Arrows (UTF-8)</p>
        <div style=${rowStyle}>${cell(
            "Left",
            html`
              <CharactersIcon
                text="🡨"
                size=${28}
              />
            `,
          )}${cell(
            "Up",
            html`
              <CharactersIcon
                text="🡩"
                size=${28}
              />
            `,
          )}${cell(
            "Right",
            html`
              <CharactersIcon
                text="🡪"
                size=${28}
              />
            `,
          )}${cell(
            "Down",
            html`
              <CharactersIcon
                text="🡫"
                size=${28}
              />
            `,
          )}</div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Density and punctuation</p>
        <div style=${rowStyle}>${cell(
            "Minus",
            html`
              <CharactersIcon
                text="−"
                size=${28}
              />
            `,
          )}${cell(
            "More",
            html`
              <CharactersIcon
                text="…"
                size=${28}
              />
            `,
          )}${cell(
            "Plus",
            html`
              <CharactersIcon
                text="+"
                size=${28}
                color="success"
              />
            `,
          )}${cell(
            "Check",
            html`
              <CharactersIcon
                text="✓"
                size=${28}
                color="success"
              />
            `,
          )}</div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Warning with triangle</p>
        <div style=${rowStyle}>${cell(
            "Glyph",
            html`
              <CharactersIcon
                text="⚠"
                color="warning"
                size=${28}
              />
            `,
          )}${cell(
            "Filled",
            html`
              <IconTriangleWrapper
                size=${40}
                color="warning"
              >
                <CharactersIcon text="⚠" />
              </IconTriangleWrapper>
            `,
          )}${cell(
            "Outline",
            html`
              <IconTriangleWrapper
                size=${40}
                color="warning"
                outline=${true}
              >
                <CharactersIcon text="⚠" />
              </IconTriangleWrapper>
            `,
          )}${cell(
            "Pulse",
            html`
              <IconTriangleWrapper
                size=${40}
                color="warning"
              >
                <CharactersIcon
                  text="⚠"
                  animated=${true}
                />
              </IconTriangleWrapper>
            `,
          )}</div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >Disc and square shells</p>
        <div style=${rowStyle}>${cell(
            "Disc",
            html`
              <IconDiscWrapper
                size=${40}
                color="accent"
              >
                <CharactersIcon text="MW" />
              </IconDiscWrapper>
            `,
          )}${cell(
            "Disc outline",
            html`
              <IconDiscWrapper
                size=${40}
                color="accent"
                outline=${true}
              >
                <CharactersIcon text="MW" />
              </IconDiscWrapper>
            `,
          )}${cell(
            "Square",
            html`
              <IconSquareWrapper
                size=${40}
                color="info"
              >
                <CharactersIcon text="JD" />
              </IconSquareWrapper>
            `,
          )}${cell(
            "Square outline",
            html`
              <IconSquareWrapper
                size=${40}
                color="info"
                outline=${true}
              >
                <CharactersIcon text="JD" />
              </IconSquareWrapper>
            `,
          )}${cell(
            "Icon in disc",
            html`
              <IconDiscWrapper
                size=${40}
                color="success"
              >
                <CheckIcon size=${20} />
              </IconDiscWrapper>
            `,
          )}</div>
        ${example(snippet)}
        ${propsTable(
          [
            {
              name: "Line icons (*Icon)",
              rows: [
                ...kitPropRows,
                [
                  "size",
                  "number",
                  "Box size in px (default 24).",
                ],
                [
                  "animated",
                  "boolean",
                  "Use the animated SVG while not reduced-motion.",
                ],
                [
                  "aria-label / title",
                  "string",
                  "Accessible name when not decorative.",
                ],
              ],
            },
            {
              name: "CharactersIcon",
              rows: [
                ...kitPropRows,
                [
                  "text",
                  "string",
                  "Glyphs to show (or children).",
                ],
                [
                  "size",
                  "number",
                  "Box size in px.",
                ],
                [
                  "animated",
                  "boolean",
                  "Pulse via `janusPulse`.",
                ],
                [
                  "children",
                  "node",
                  "Alternate glyph source.",
                ],
              ],
            },
            {
              name: "Icon wrappers",
              rows: [
                ...kitPropRows,
                [
                  "size",
                  "number",
                  "Wrapper size.",
                ],
                [
                  "outline",
                  "boolean",
                  "Stroke outline (square/triangle).",
                ],
                [
                  "children",
                  "node",
                  "Icon or CharactersIcon inside.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiIcons);
