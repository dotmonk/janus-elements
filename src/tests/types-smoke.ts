import type {
  JanusProps,
  JanusStyle,
} from "../janus/index.d.ts";
import type {
  ButtonProps,
} from "../janus/ui/Button.d.ts";
import type {
  SelectProps,
} from "../janus/ui/Select.d.ts";
import type {
  AccordionProps,
} from "../janus/ui/Accordion.d.ts";
import type {
  IconComponent,
  IconProps,
} from "../janus/ui/icon.d.ts";
import type {
  InputProps,
} from "../janus/ui/Input.d.ts";
import type {
  CharactersIconProps,
} from "../janus/ui/CharactersIcon.d.ts";
import type {
  IconDiscWrapperProps,
} from "../janus/ui/IconDiscWrapper.d.ts";
import type {
  IconSquareWrapperProps,
} from "../janus/ui/IconSquareWrapper.d.ts";
import type {
  IconTriangleWrapperProps,
} from "../janus/ui/IconTriangleWrapper.d.ts";
import type {
  NavbarProps,
} from "../janus/ui/Navbar.d.ts";
import type {
  ToolbarProps,
} from "../janus/ui/Toolbar.d.ts";
import type {
  NumberInputProps,
} from "../janus/ui/NumberInput.d.ts";
import type {
  RangeInputProps,
} from "../janus/ui/RangeInput.d.ts";
import type {
  ColorInputProps,
} from "../janus/ui/ColorInput.d.ts";
import type {
  FileInputProps,
} from "../janus/ui/FileInput.d.ts";
import type {
  DatePickerProps,
} from "../janus/ui/DatePicker.d.ts";
import type {
  TimePickerProps,
} from "../janus/ui/TimePicker.d.ts";
import type {
  DateTimePickerProps,
} from "../janus/ui/DateTimePicker.d.ts";
import type {
  WeekPickerProps,
} from "../janus/ui/WeekPicker.d.ts";
import type {
  MonthPickerProps,
} from "../janus/ui/MonthPicker.d.ts";
import type {
  DateRangePickerProps,
} from "../janus/ui/DateRangePicker.d.ts";
import type {
  TableProps,
} from "../janus/ui/Table.d.ts";
import type {
  RichTextareaProps,
} from "../janus/ui/RichTextarea.d.ts";

declare const SearchIcon: IconComponent;
declare const ChevronIcon: IconComponent;

const style: JanusStyle = {
  color: "red",
  ":hover": {
    color: "blue",
  },
};
const props: JanusProps = {
  style,
};
const button: ButtonProps = {
  color: "accent",
  disabled: false,
  style,
};

const _inputWithIcons: InputProps = {
  value: "query",
  headIcon: SearchIcon,
  tailIcon: null,
};

const select: SelectProps = {
  options: [
    {
      value: "a",
      name: "A",
    },
  ],
  value: "a",
  searchable: true,
  headIcon: SearchIcon,
  tailIcon: null,
  clearable: false,
  noOptionsMessage: "No options",
};

const _selectDefaultTail: SelectProps = {
  options: [
    {
      value: "a",
      name: "A",
    },
  ],
  tailIcon: ChevronIcon,
};
const multiSelect: SelectProps = {
  multi: true,
  clearable: true,
  options: [
    {
      value: "a",
      name: "A",
    },
    {
      value: "b",
      name: "B",
    },
  ],
  value: [
    "a",
  ],
  onChange: (value) => {
    void value;
  },
};
const groupedCreatable: SelectProps = {
  creatable: true,
  formatCreateLabel: (input) => `Add ${input}`,
  onCreateOption: (input) => {
    void input;
  },
  options: [
    {
      name: "Letters",
      options: [
        {
          value: "a",
          name: "A",
        },
        {
          value: "b",
          name: "B",
          disabled: true,
        },
      ],
    },
  ],
};
const _asyncSelect: SelectProps = {
  cacheOptions: true,
  defaultOptions: true,
  loading: false,
  loadingMessage: "Loading…",
  loadOptions: async (input) => [
    {
      value: input,
      name: input,
    },
  ],
  renderOption: (option, meta) => `${meta.active ? ">" : ""}${option.name}`,
  renderValue: (option) => option.name,
};
const accordion: AccordionProps = {
  items: [
    {
      id: "one",
      title: "One",
      content: "Body",
    },
  ],
};
const icon: IconProps = {
  size: 24,
  animated: true,
  "aria-label": "Star",
};
const characters: CharactersIconProps = {
  text: "MW",
  size: 24,
  color: "accent",
  animated: true,
};
const disc: IconDiscWrapperProps = {
  size: 40,
  color: "accent",
  outline: true,
};
const square: IconSquareWrapperProps = {
  size: 40,
  color: "info",
};
const triangle: IconTriangleWrapperProps = {
  size: 40,
  color: "warning",
  outline: true,
};
const navbar: NavbarProps = {
  titles: [
    "A",
    "B",
  ],
  value: "A",
  label: "Sections",
};
const toolbar: ToolbarProps = {
  label: "Actions",
  orientation: "horizontal",
};
void toolbar;
const numberInput: NumberInputProps = {
  value: 3,
  min: 0,
  max: 100,
  step: 1,
  onChange: (value) => {
    void value;
  },
};
const rangeInput: RangeInputProps = {
  value: 40,
  min: 0,
  max: 100,
  onChange: (value) => {
    void value;
  },
};
const colorInput: ColorInputProps = {
  value: "#e3b04b",
  onChange: (value) => {
    void value;
  },
};
const fileInput: FileInputProps = {
  accept: "image/*",
  multiple: true,
  onChange: (files) => {
    void files;
  },
};
const datePicker: DatePickerProps = {
  value: "2026-10-28",
  clearable: true,
  onChange: (value) => {
    void value;
  },
};
const timePicker: TimePickerProps = {
  value: "14:30",
  hour12: false,
  onChange: (value) => {
    void value;
  },
};
const dateTimePicker: DateTimePickerProps = {
  value: "2026-10-28T14:30",
  onChange: (value) => {
    void value;
  },
};
const weekPicker: WeekPickerProps = {
  value: "2026-W44",
  onChange: (value) => {
    void value;
  },
};
const monthPicker: MonthPickerProps = {
  value: "2026-10",
  onChange: (value) => {
    void value;
  },
};
const dateRangePicker: DateRangePickerProps = {
  value: {
    start: "2026-10-10",
    end: "2026-10-20",
  },
  clearable: true,
  onChange: (value) => {
    void value;
  },
};

void props;
void button;
void select;
void multiSelect;
void groupedCreatable;
void accordion;
void icon;
void characters;
void disc;
void square;
void triangle;
void navbar;
void numberInput;
void rangeInput;
void colorInput;
void fileInput;
void datePicker;
void timePicker;
void dateTimePicker;
void weekPicker;
void monthPicker;
void dateRangePicker;

const table: TableProps = {
  caption: "Inventory",
  height: 320,
  rowHeight: 40,
  overscan: 5,
  columns: [
    {
      key: "name",
      title: "Name",
      width: "1fr",
    },
    {
      key: "stock",
      title: "Stock",
      align: "right",
      render: (row) => String(row.stock),
    },
  ],
  rows: [
    {
      id: 1,
      name: "Item",
      stock: 3,
    },
  ],
};
void table;

const richTextarea: RichTextareaProps = {
  value: "# Hello",
  placeholder: "Write…",
  onChange: (value) => {
    void value;
  },
};
void richTextarea;
