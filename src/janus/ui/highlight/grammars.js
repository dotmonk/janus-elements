import {
  matchBalanced,
  matchTemplateLiteral,
} from "./engine.js";

const wordRule = (type, words, flags = "") => ({
  type,
  pattern: new RegExp(
    `\\b(?:${words.join("|")})\\b`,
    flags,
  ),
});

const commentLine = (prefix = "//") => ({
  type: "comment",
  pattern: new RegExp(
    `${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*$`,
    "m",
  ),
});

const commentBlock = {
  type: "comment",
  pattern: /\/\*[\s\S]*?\*\//,
};

const stringDouble = {
  type: "string",
  pattern: /"(?:\\.|[^"\\])*"/,
};

const stringSingle = {
  type: "string",
  pattern: /'(?:\\.|[^'\\])*'/,
};

/** Go raw string — no interpolations. */
const stringBacktickRaw = {
  type: "string",
  pattern: /`[^`]*`/,
};

const jsInterpolation = (grammar) => ({
  type: "interpolation",
  balanced: {
    prefix: "${",
    open: "{",
    close: "}",
  },
  delimiters: {
    open: "${",
    close: "}",
  },
  inside: grammar,
});

const jsTemplateString = (grammar) => ({
  type: "string",
  match: (text, from) => {
    const start = text.indexOf(
      "`",
      from,
    );
    if (start < 0) {
      return null;
    }
    return matchTemplateLiteral(
      text,
      start,
    );
  },
  inside: [
    jsInterpolation(grammar),
  ],
});

const numberRule = {
  type: "number",
  pattern: /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
};

const punctuationRule = {
  type: "punctuation",
  pattern: /[{}[\]();,.:]/,
};

const operatorRule = {
  type: "operator",
  pattern: /[+\-*/%=<>!&|^~?:]+/,
};

const booleanRule = wordRule(
  "boolean",
  [
    "true",
    "false",
  ],
);
const nullRule = wordRule(
  "constant",
  [
    "null",
    "undefined",
    "NaN",
    "Infinity",
  ],
);

const functionCall = {
  type: "function",
  pattern: /\b[A-Za-z_]\w*(?=\s*\()/,
};

const className = {
  type: "class-name",
  pattern: /\b[A-Z][A-Za-z0-9_]*/,
};

/** Unquoted keys in `{ key: value }` / struct literals (not ternary `a : b`). */
const objectKey = {
  type: "property",
  pattern: /(?<=[{,]\s*)[A-Za-z_$][\w$]*(?=\s*:)/,
};

/** Quoted keys before `:` (JSON, Python dicts, Go maps, …). */
const stringKeyDouble = {
  type: "property",
  pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/,
};

const stringKeySingle = {
  type: "property",
  pattern: /'(?:\\.|[^'\\])*'(?=\s*:)/,
};

const clike = (keywords) => [
  commentBlock,
  commentLine("//"),
  stringDouble,
  stringSingle,
  numberRule,
  booleanRule,
  wordRule(
    "keyword",
    keywords,
  ),
  functionCall,
  className,
  operatorRule,
  punctuationRule,
];

const JS_KEYWORDS = [
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "of",
  "return",
  "set",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
];

const TS_KEYWORDS = [
  ...JS_KEYWORDS,
  "abstract",
  "as",
  "asserts",
  "declare",
  "enum",
  "implements",
  "interface",
  "is",
  "keyof",
  "namespace",
  "never",
  "private",
  "protected",
  "public",
  "readonly",
  "require",
  "satisfies",
  "type",
  "unique",
  "unknown",
];

const javascript = [];
javascript.push(
  commentBlock,
  commentLine("//"),
  jsTemplateString(javascript),
  stringKeyDouble,
  stringKeySingle,
  stringDouble,
  stringSingle,
  {
    type: "regex",
    pattern: /\/(?:\\.|[^/\\\n])+\/[gimsuy]*/,
  },
  numberRule,
  booleanRule,
  nullRule,
  wordRule(
    "keyword",
    JS_KEYWORDS,
  ),
  objectKey,
  functionCall,
  className,
  operatorRule,
  punctuationRule,
);

const typescript = [];
typescript.push(
  commentBlock,
  commentLine("//"),
  jsTemplateString(typescript),
  stringKeyDouble,
  stringKeySingle,
  stringDouble,
  stringSingle,
  {
    type: "regex",
    pattern: /\/(?:\\.|[^/\\\n])+\/[gimsuy]*/,
  },
  numberRule,
  booleanRule,
  nullRule,
  wordRule(
    "keyword",
    TS_KEYWORDS,
  ),
  wordRule(
    "builtin",
    [
      "string",
      "number",
      "boolean",
      "any",
      "void",
      "object",
      "symbol",
      "bigint",
      "never",
      "unknown",
    ],
  ),
  objectKey,
  functionCall,
  className,
  operatorRule,
  punctuationRule,
);

const attrInside = [
  {
    type: "attr-name",
    pattern: /[^\s"'=<>/`]+/,
  },
  {
    type: "attr-value",
    pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
    inside: [
      {
        type: "punctuation",
        pattern: /^=/,
      },
      stringDouble,
      stringSingle,
    ],
  },
  {
    type: "punctuation",
    pattern: /\/?>/,
  },
];

const markupTag = {
  type: "tag",
  pattern: /<\/?(?!\d)[^\s>/=]+(?:\s+[^\s>/=]+(?:=(?:("|')[\s\S]*?\1|[^\s'">=]+))?)*\s*\/?>/,
  inside: [
    {
      type: "tag",
      pattern: /^<\/?[^\s>/]+/,
      alias: "class-name",
      inside: [
        {
          type: "punctuation",
          pattern: /^<\/?/,
        },
      ],
    },
    {
      type: "punctuation",
      pattern: /\/?>$/,
    },
    ...attrInside,
  ],
};

const markup = [
  {
    type: "comment",
    pattern: /<!--[\s\S]*?-->/,
  },
  {
    type: "doctype",
    pattern: /<!DOCTYPE[\s\S]+?>/i,
    alias: "prolog",
  },
  {
    type: "cdata",
    pattern: /<!\[CDATA\[[\s\S]*?]]>/i,
  },
  {
    type: "prolog",
    pattern: /<\?[\s\S]+?\?>/,
  },
  markupTag,
  {
    type: "entity",
    pattern: /&[\da-z]{1,8};/i,
  },
];

const html = markup;

const xml = [
  {
    type: "comment",
    pattern: /<!--[\s\S]*?-->/,
  },
  {
    type: "prolog",
    pattern: /<\?[\s\S]+?\?>/,
  },
  {
    type: "cdata",
    pattern: /<!\[CDATA\[[\s\S]*?]]>/i,
  },
  markupTag,
  {
    type: "entity",
    pattern: /&[\da-z]{1,8};/i,
  },
];

const css = [
  commentBlock,
  {
    type: "atrule",
    pattern: /@[\w-]+[^{;]*(?:;|(?=\s*\{))/,
    inside: [
      {
        type: "keyword",
        pattern: /^@[\w-]+/,
      },
      stringDouble,
      stringSingle,
    ],
  },
  {
    type: "selector",
    pattern: /[^{}\s][^{};]*(?=\s*\{)/,
  },
  {
    type: "property",
    pattern: /[-_a-zA-Z]+\s*(?=:)/,
  },
  stringDouble,
  stringSingle,
  {
    type: "important",
    pattern: /!important\b/,
  },
  numberRule,
  {
    type: "unit",
    pattern: /\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|fr)\b/,
  },
  punctuationRule,
  operatorRule,
];

const json = [
  stringKeyDouble,
  stringDouble,
  numberRule,
  booleanRule,
  wordRule(
    "constant",
    [
      "null",
    ],
  ),
  {
    type: "punctuation",
    pattern: /[{}[\]:,]/,
  },
];

const csv = [
  stringDouble,
  stringSingle,
  numberRule,
  {
    type: "punctuation",
    pattern: /,/,
  },
];

const markdown = [
  {
    type: "code",
    pattern: /```[\s\S]*?```|`[^`\n]+`/,
    alias: "string",
  },
  {
    type: "title",
    pattern: /^#{1,6}.+$/m,
    alias: "important",
  },
  {
    type: "url",
    pattern: /\[[^\]]+\]\([^)]+\)/,
    inside: [
      {
        type: "string",
        pattern: /\[[^\]]+\]/,
      },
      {
        type: "url",
        pattern: /\([^)]+\)/,
      },
    ],
  },
  {
    type: "bold",
    pattern: /\*\*[^*]+\*\*|__[^_]+__/,
  },
  {
    type: "italic",
    pattern: /\*[^*]+\*|_[^_]+_/,
  },
  {
    type: "list",
    pattern: /^\s*[-*+](?=\s)/m,
    alias: "punctuation",
  },
  {
    type: "hr",
    pattern: /^[-*_]{3,}\s*$/m,
    alias: "punctuation",
  },
];

const shellVariableInside = {
  type: "variable",
  pattern: /\$\{[^}]+\}|\$\w+|\$\d+/,
};

const shell = [
  commentLine("#"),
  {
    type: "string",
    pattern: /"(?:\\.|[^"\\])*"/,
    inside: [
      shellVariableInside,
    ],
  },
  stringSingle,
  // Command substitution, not a JS template
  stringBacktickRaw,
  {
    type: "variable",
    pattern: /\$\{?\w+\}?|\$\d+/,
  },
  wordRule(
    "keyword",
    [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "for",
      "while",
      "do",
      "done",
      "case",
      "esac",
      "function",
      "return",
      "in",
      "select",
      "time",
      "until",
    ],
  ),
  {
    type: "function",
    pattern: /\b(?:cd|echo|export|source|alias|grep|sed|awk|cat|ls|mkdir|rm|cp|mv|chmod|chown|sudo|apt|npm|node|python|pip|git|curl|wget|docker)\b/,
  },
  operatorRule,
  punctuationRule,
];

const perlVariableInside = {
  type: "variable",
  pattern: /[$@%]\w+/,
};

const perlHashKey = {
  type: "property",
  pattern: /(?<=[{,]\s*)[A-Za-z_]\w*(?=\s*=>)/,
};

const perl = [
  {
    type: "comment",
    pattern: /#.*/m,
  },
  {
    type: "string",
    pattern: /"(?:\\.|[^"\\])*"/,
    inside: [
      perlVariableInside,
    ],
  },
  stringSingle,
  {
    type: "string",
    pattern: /q[qwx]?(?:'[^']*'|"[^"]*"|\/[^\/]*\/)/,
  },
  {
    type: "variable",
    pattern: /[$@%]\w+/,
  },
  numberRule,
  perlHashKey,
  wordRule(
    "keyword",
    [
      "my",
      "our",
      "local",
      "sub",
      "package",
      "use",
      "require",
      "if",
      "elsif",
      "else",
      "unless",
      "while",
      "until",
      "for",
      "foreach",
      "do",
      "next",
      "last",
      "redo",
      "return",
      "print",
      "say",
      "die",
      "warn",
    ],
  ),
  operatorRule,
  punctuationRule,
];

const matchPythonFString = (text, from) => {
  const opener = /(?:[fF][rR]?|[rR][fF])("""|'''|"|')/g;
  opener.lastIndex = from;
  const open = opener.exec(text);
  if (
    !open ||
    open.index < from
  ) {
    return null;
  }
  const quote = open[1];
  let cursor = open.index + open[0].length;
  while (cursor < text.length) {
    if (text[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (text.startsWith(
      quote,
      cursor,
    )) {
      const end = cursor + quote.length;
      return {
        index: open.index,
        length: end - open.index,
        value: text.slice(
          open.index,
          end,
        ),
      };
    }
    if (
      text[cursor] === "{" &&
      text[cursor + 1] === "{"
    ) {
      cursor += 2;
      continue;
    }
    if (
      text[cursor] === "}" &&
      text[cursor + 1] === "}"
    ) {
      cursor += 2;
      continue;
    }
    if (text[cursor] === "{") {
      const expression = matchBalanced(
        text,
        cursor,
        "{",
        "{",
        "}",
      );
      if (!expression) {
        return null;
      }
      cursor = expression.index + expression.length;
      continue;
    }
    cursor += 1;
  }
  return null;
};

const pythonFStringInterpolation = (grammar) => ({
  type: "interpolation",
  match: (text, from) => {
    let index = from;
    while (index < text.length) {
      if (
        text[index] === "{" &&
        text[index + 1] === "{"
      ) {
        index += 2;
        continue;
      }
      if (
        text[index] === "}" &&
        text[index + 1] === "}"
      ) {
        index += 2;
        continue;
      }
      if (text[index] === "{") {
        return matchBalanced(
          text,
          index,
          "{",
          "{",
          "}",
        );
      }
      index += 1;
    }
    return null;
  },
  delimiters: {
    open: "{",
    close: "}",
  },
  inside: grammar,
});

const python = [];
python.push(
  {
    type: "comment",
    pattern: /#.*/m,
  },
  {
    type: "string",
    match: matchPythonFString,
    inside: [
      pythonFStringInterpolation(python),
    ],
  },
  stringKeyDouble,
  stringKeySingle,
  {
    type: "string",
    pattern: /(?:[rRuU](?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
  },
  {
    type: "decorator",
    pattern: /@\w+(?:\.\w+)*/,
    alias: "function",
  },
  numberRule,
  booleanRule,
  wordRule(
    "constant",
    [
      "None",
      "True",
      "False",
      "Ellipsis",
      "NotImplemented",
    ],
  ),
  wordRule(
    "keyword",
    [
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "nonlocal",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield",
      "match",
      "case",
    ],
  ),
  objectKey,
  functionCall,
  className,
  operatorRule,
  punctuationRule,
);

const C_KEYWORDS = [
  "auto",
  "break",
  "case",
  "char",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "float",
  "for",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "register",
  "restrict",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "typedef",
  "union",
  "unsigned",
  "void",
  "volatile",
  "while",
  "_Bool",
  "_Complex",
  "_Imaginary",
];

const CPP_KEYWORDS = [
  ...C_KEYWORDS,
  "alignas",
  "alignof",
  "and",
  "and_eq",
  "asm",
  "bitand",
  "bitor",
  "bool",
  "catch",
  "class",
  "compl",
  "concept",
  "constexpr",
  "const_cast",
  "decltype",
  "delete",
  "dynamic_cast",
  "explicit",
  "export",
  "false",
  "friend",
  "mutable",
  "namespace",
  "new",
  "noexcept",
  "not",
  "not_eq",
  "nullptr",
  "operator",
  "or",
  "or_eq",
  "private",
  "protected",
  "public",
  "reinterpret_cast",
  "requires",
  "static_assert",
  "static_cast",
  "template",
  "this",
  "thread_local",
  "throw",
  "true",
  "try",
  "typeid",
  "typename",
  "using",
  "virtual",
  "wchar_t",
  "xor",
  "xor_eq",
];

const c = clike(C_KEYWORDS);
const cpp = clike(CPP_KEYWORDS);

const java = clike(
  [
    "abstract",
    "assert",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "goto",
    "if",
    "implements",
    "import",
    "instanceof",
    "int",
    "interface",
    "long",
    "native",
    "new",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "strictfp",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "try",
    "void",
    "volatile",
    "while",
    "var",
    "yield",
    "record",
    "sealed",
    "permits",
    "non-sealed",
  ],
);

const sql = [
  commentBlock,
  commentLine("--"),
  stringSingle,
  stringDouble,
  numberRule,
  wordRule(
    "keyword",
    [
      "ADD",
      "ALL",
      "ALTER",
      "AND",
      "ANY",
      "AS",
      "ASC",
      "BETWEEN",
      "BY",
      "CASE",
      "CHECK",
      "COLUMN",
      "CONSTRAINT",
      "CREATE",
      "DATABASE",
      "DEFAULT",
      "DELETE",
      "DESC",
      "DISTINCT",
      "DROP",
      "ELSE",
      "END",
      "EXISTS",
      "FOREIGN",
      "FROM",
      "FULL",
      "GROUP",
      "HAVING",
      "IN",
      "INDEX",
      "INNER",
      "INSERT",
      "INTO",
      "IS",
      "JOIN",
      "KEY",
      "LEFT",
      "LIKE",
      "LIMIT",
      "NOT",
      "NULL",
      "ON",
      "OR",
      "ORDER",
      "OUTER",
      "PRIMARY",
      "REFERENCES",
      "RIGHT",
      "SELECT",
      "SET",
      "TABLE",
      "THEN",
      "UNION",
      "UNIQUE",
      "UPDATE",
      "VALUES",
      "VIEW",
      "WHEN",
      "WHERE",
      "WITH",
    ],
    "i",
  ),
  booleanRule,
  operatorRule,
  punctuationRule,
];

const yaml = [
  {
    type: "comment",
    pattern: /#.*/m,
  },
  {
    type: "key",
    pattern: /^[ \t]*-?[ \t]*[\w.-]+(?=\s*:)/m,
    alias: "property",
  },
  stringDouble,
  stringSingle,
  {
    type: "string",
    pattern: /[|>][-+]?(?:\n(?:[ \t].*)?)*/,
  },
  numberRule,
  booleanRule,
  wordRule(
    "constant",
    [
      "null",
      "Null",
      "NULL",
      "~",
      "true",
      "false",
      "True",
      "False",
    ],
  ),
  {
    type: "punctuation",
    pattern: /[:\-?[\]{},|>&*!]/,
  },
];

const diff = [
  {
    type: "deleted",
    pattern: /^[-].*$/m,
  },
  {
    type: "inserted",
    pattern: /^[+].*$/m,
  },
  {
    type: "coord",
    pattern: /^@@.*@@.*$/m,
    alias: "important",
  },
  {
    type: "diff",
    pattern: /^[Dd]iff --.+$/m,
    alias: "keyword",
  },
  {
    type: "comment",
    pattern: /^[Ii]ndex .+$/m,
  },
];

const rust = [
  commentBlock,
  commentLine("//"),
  stringKeyDouble,
  stringDouble,
  {
    type: "char",
    pattern: /'(?:\\.|[^'\\])'/,
  },
  numberRule,
  booleanRule,
  wordRule(
    "keyword",
    [
      "as",
      "async",
      "await",
      "break",
      "const",
      "continue",
      "crate",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "match",
      "mod",
      "move",
      "mut",
      "pub",
      "ref",
      "return",
      "self",
      "Self",
      "static",
      "struct",
      "super",
      "trait",
      "true",
      "type",
      "unsafe",
      "use",
      "where",
      "while",
    ],
  ),
  wordRule(
    "builtin",
    [
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "isize",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "usize",
      "f32",
      "f64",
      "bool",
      "char",
      "str",
    ],
  ),
  {
    type: "attribute",
    pattern: /#!?\[[^\]]*]/,
    alias: "atrule",
  },
  objectKey,
  functionCall,
  className,
  operatorRule,
  punctuationRule,
];

const go = [
  commentBlock,
  commentLine("//"),
  stringKeyDouble,
  stringDouble,
  stringBacktickRaw,
  {
    type: "char",
    pattern: /'(?:\\.|[^'\\])'/,
  },
  numberRule,
  booleanRule,
  wordRule(
    "constant",
    [
      "nil",
      "true",
      "false",
      "iota",
    ],
  ),
  wordRule(
    "keyword",
    [
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var",
    ],
  ),
  wordRule(
    "builtin",
    [
      "bool",
      "byte",
      "complex64",
      "complex128",
      "error",
      "float32",
      "float64",
      "int",
      "int8",
      "int16",
      "int32",
      "int64",
      "rune",
      "string",
      "uint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "uintptr",
    ],
  ),
  objectKey,
  functionCall,
  className,
  operatorRule,
  punctuationRule,
];

export const grammars = {
  plain: [],
  javascript,
  typescript,
  html,
  xml,
  css,
  json,
  csv,
  markdown,
  shell,
  perl,
  python,
  c,
  cpp,
  java,
  sql,
  yaml,
  diff,
  rust,
  go,
};
