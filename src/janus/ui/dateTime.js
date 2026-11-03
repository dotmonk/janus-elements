const pad2 = (value) => String(value).padStart(
  2,
  "0",
);

export const todayISO = () => {
  const now = new Date();
  return formatISODate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
};

export const formatISODate = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;

export const parseISODate = (value) => {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(
      year,
      month,
    )
  ) {
    return null;
  }
  return {
    year,
    month,
    day,
  };
};

export const formatISOTime = (hour, minute, second, withSeconds) => {
  const base = `${pad2(hour)}:${pad2(minute)}`;
  return withSeconds
    ? `${base}:${pad2(second || 0)}`
    : base;
};

export const parseISOTime = (value) => {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined
    ? 0
    : Number(match[3]);
  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    hour < 0 ||
    minute < 0 ||
    second < 0
  ) {
    return null;
  }
  return {
    hour,
    minute,
    second,
    hasSeconds: match[3] !== undefined,
  };
};

export const formatISODateTime = (year, month, day, hour, minute, second, withSeconds) => `${formatISODate(year, month, day)}T${formatISOTime(hour, minute, second, withSeconds)}`;

export const parseISODateTime = (value) => {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const date = parseISODate(match[1]);
  const time = parseISOTime(match[2]);
  if (
    !date ||
    !time
  ) {
    return null;
  }
  return {
    ...date,
    ...time,
  };
};

export const formatISOMonth = (year, month) => `${year}-${pad2(month)}`;

export const parseISOMonth = (value) => {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return {
    year,
    month,
  };
};

export const formatISOWeek = (weekYear, week) => `${weekYear}-W${pad2(week)}`;

export const parseISOWeek = (value) => {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return null;
  }
  const match = /^(\d{4})-W(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const weekYear = Number(match[1]);
  const week = Number(match[2]);
  if (
    week < 1 ||
    week > 53
  ) {
    return null;
  }
  return {
    weekYear,
    week,
  };
};

export const daysInMonth = (year, month) => new Date(
  year,
  month,
  0,
).getDate();

export const addMonths = (year, month, delta) => {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index % 12 + 1;
  return {
    year: nextYear,
    month: nextMonth,
  };
};

export const compareISODate = (left, right) => {
  if (
    !left &&
    !right
  ) {
    return 0;
  }
  if (!left) {
    return -1;
  }
  if (!right) {
    return 1;
  }
  return left < right
    ? -1
    : left > right
    ? 1
    : 0;
};

export const isDateDisabled = (iso, min, max) => {
  if (
    min &&
    compareISODate(
      iso,
      min,
    ) < 0
  ) {
    return true;
  }
  if (
    max &&
    compareISODate(
      iso,
      max,
    ) > 0
  ) {
    return true;
  }
  return false;
};

/** Monday = 1 … Sunday = 7 (ISO). */
export const isoWeekday = (year, month, day) => {
  const weekday = new Date(
    year,
    month - 1,
    day,
  ).getDay();
  return weekday === 0
    ? 7
    : weekday;
};

export const isoWeekParts = (year, month, day) => {
  const date = new Date(Date.UTC(
    year,
    month - 1,
    day,
  ));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(
    weekYear,
    0,
    1,
  ));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return {
    weekYear,
    week,
  };
};

export const mondayOfISOWeek = (weekYear, week) => {
  const jan4 = new Date(Date.UTC(
    weekYear,
    0,
    4,
  ));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return {
    year: monday.getUTCFullYear(),
    month: monday.getUTCMonth() + 1,
    day: monday.getUTCDate(),
  };
};

export const datesInISOWeek = (weekYear, week) => {
  const start = mondayOfISOWeek(
    weekYear,
    week,
  );
  const dates = [];
  let cursor = new Date(
    start.year,
    start.month - 1,
    start.day,
  );
  for (let index = 0; index < 7; index += 1) {
    dates.push(formatISODate(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      cursor.getDate(),
    ));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const resolveLocale = (locale) => {
  if (locale) {
    return locale;
  }
  return "en-US";
};

/** Replace `{name}` tokens in a template with values from a map. */
export const formatTemplate = (template, values) => String(template ?? "").replace(
  /\{(\w+)\}/g,
  (_, key) => values[key] != null
    ? String(values[key])
    : "",
);

export const getFirstDayOfWeek = (locale) => {
  try {
    const info = new Intl.Locale(resolveLocale(locale));
    if (typeof info.weekInfo?.firstDay === "number") {
      const day = info.weekInfo.firstDay;
      return day === 7
        ? 0
        : day;
    }
  } catch {
    // fall through
  }
  return 1;
};

export const getWeekdayNames = (locale, firstDay = 1) => {
  const resolved = resolveLocale(locale);
  const formatter = new Intl.DateTimeFormat(
    resolved,
    {
      weekday: "short",
    },
  );
  // 2024-01-07 is a Sunday; build Mon..Sun then rotate.
  const sunday = new Date(
    2024,
    0,
    7,
  );
  const names = Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return formatter.format(date);
    },
  );
  const start = firstDay % 7;
  return names.slice(start).concat(names.slice(
    0,
    start,
  ));
};

export const getMonthNames = (locale, form = "long") => {
  const formatter = new Intl.DateTimeFormat(
    resolveLocale(locale),
    {
      month: form,
    },
  );
  return Array.from(
    {
      length: 12,
    },
    (_, index) => formatter.format(new Date(
      2024,
      index,
      1,
    )),
  );
};

export const formatDisplayDate = (iso, locale) => {
  const parts = parseISODate(iso);
  if (!parts) {
    return "";
  }
  return new Intl.DateTimeFormat(
    resolveLocale(locale),
    {
      dateStyle: "medium",
    },
  ).format(new Date(
    parts.year,
    parts.month - 1,
    parts.day,
  ));
};

export const formatDisplayMonth = (isoMonth, locale) => {
  const parts = parseISOMonth(isoMonth);
  if (!parts) {
    return "";
  }
  return new Intl.DateTimeFormat(
    resolveLocale(locale),
    {
      month: "long",
      year: "numeric",
    },
  ).format(new Date(
    parts.year,
    parts.month - 1,
    1,
  ));
};

export const formatDisplayTime = (isoTime, locale, hour12) => {
  const parts = parseISOTime(isoTime);
  if (!parts) {
    return "";
  }
  const date = new Date();
  date.setHours(
    parts.hour,
    parts.minute,
    parts.second || 0,
    0,
  );
  return new Intl.DateTimeFormat(
    resolveLocale(locale),
    {
      hour: "numeric",
      minute: "2-digit",
      second: parts.hasSeconds
        ? "2-digit"
        : undefined,
      hour12: Boolean(hour12),
    },
  ).format(date);
};

export const calendarCells = (year, month, firstDay, min, max) => {
  const startWeekday = new Date(
    year,
    month - 1,
    1,
  ).getDay();
  const offset = (startWeekday - firstDay + 7) % 7;
  const total = daysInMonth(
    year,
    month,
  );
  const cells = [];
  const prev = addMonths(
    year,
    month,
    -1,
  );
  const prevDays = daysInMonth(
    prev.year,
    prev.month,
  );

  for (let index = 0; index < offset; index += 1) {
    const day = prevDays - offset + index + 1;
    const iso = formatISODate(
      prev.year,
      prev.month,
      day,
    );
    cells.push(
      {
        iso,
        day,
        inMonth: false,
        disabled: isDateDisabled(
          iso,
          min,
          max,
        ),
      },
    );
  }
  for (let day = 1; day <= total; day += 1) {
    const iso = formatISODate(
      year,
      month,
      day,
    );
    cells.push(
      {
        iso,
        day,
        inMonth: true,
        disabled: isDateDisabled(
          iso,
          min,
          max,
        ),
      },
    );
  }
  const next = addMonths(
    year,
    month,
    1,
  );
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const iso = formatISODate(
      next.year,
      next.month,
      nextDay,
    );
    cells.push(
      {
        iso,
        day: nextDay,
        inMonth: false,
        disabled: isDateDisabled(
          iso,
          min,
          max,
        ),
      },
    );
    nextDay += 1;
  }
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(
      index,
      index + 7,
    ));
  }
  return weeks;
};

export const shiftISODate = (iso, dayDelta) => {
  const parts = parseISODate(iso) || parseISODate(todayISO());
  const date = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
  );
  date.setDate(date.getDate() + dayDelta);
  return formatISODate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
};
