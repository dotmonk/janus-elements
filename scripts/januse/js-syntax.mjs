// Hand-rolled JavaScript/TypeScript parser, pretty-printer and lint helpers.
// Zero dependencies. The AST is ESTree-shaped with `TS*` nodes for TypeScript.

import {
  parseHtmlTemplate,
  printHtmlTemplate,
} from "./html-template.mjs";

const INDENT = "  ";

// ---------------------------------------------------------------------------
// Positions and errors
// ---------------------------------------------------------------------------

class SyntaxFailure extends Error {
  constructor(message, offset) {
    super(message);
    this.offset = offset;
  }
}

function makeLocator(source) {
  const lineStarts = [0];
  for (let index = 0; index < source.length; index++) {
    if (source.charCodeAt(index) === 10) {
      lineStarts.push(index + 1);
    }
  }
  return (offset) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle] <= offset) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return { line: low + 1, column: offset - lineStarts[low] + 1 };
  };
}

// ---------------------------------------------------------------------------
// Lexical tables
// ---------------------------------------------------------------------------

const RESERVED_WORDS = new Set(
  (
    "break case catch class const continue debugger default delete do else enum export extends " +
    "false finally for function if import in instanceof new null return super switch this throw " +
    "true try typeof var void while with"
  ).split(" "),
);

const PUNCTUATORS_BY_LENGTH = [
  null,
  new Set("{ } ( ) [ ] ; , < > + - * / % & | ^ ! ~ ? : = . @".split(" ")),
  new Set(
    "=> == != <= >= && || ?? ?. ++ -- += -= *= /= %= &= |= ^= << >> **".split(" "),
  ),
  new Set("... === !== **= <<= >>= >>> &&= ||= ??=".split(" ")),
  new Set([">>>="]),
];

const ASSIGNMENT_OPERATORS = new Set(
  "= += -= *= /= %= **= <<= >>= >>>= &= |= ^= &&= ||= ??=".split(" "),
);

const BINARY_PRECEDENCE = {
  "??": 1,
  "||": 2,
  "&&": 3,
  "|": 4,
  "^": 5,
  "&": 6,
  "==": 7,
  "!=": 7,
  "===": 7,
  "!==": 7,
  "<": 8,
  ">": 8,
  "<=": 8,
  ">=": 8,
  in: 8,
  instanceof: 8,
  as: 8,
  satisfies: 8,
  "<<": 9,
  ">>": 9,
  ">>>": 9,
  "+": 10,
  "-": 10,
  "*": 11,
  "/": 11,
  "%": 11,
  "**": 12,
};

const KEYWORD_TYPES = new Set(
  "any unknown never string number boolean symbol bigint object void null undefined".split(" "),
);

const NUMBER_PATTERN =
  /0[xX][\da-fA-F_]+n?|0[oO][0-7_]+n?|0[bB][01_]+n?|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?n?/y;

const ID_START = /[\p{ID_Start}$_]/u;
const ID_PART = /[\p{ID_Continue}$\u200c\u200d]/u;

function identifierStartLength(source, position) {
  const code = source.charCodeAt(position);
  if (code < 128) {
    const isAscii =
      (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 36 || code === 95;
    return isAscii ? 1 : 0;
  }
  const character = String.fromCodePoint(source.codePointAt(position));
  return ID_START.test(character) ? character.length : 0;
}

function identifierPartLength(source, position) {
  const code = source.charCodeAt(position);
  if (code < 128) {
    const isAscii =
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 36 ||
      code === 95;
    return isAscii ? 1 : 0;
  }
  const character = String.fromCodePoint(source.codePointAt(position));
  return ID_PART.test(character) ? character.length : 0;
}

function decodeStringLiteral(raw) {
  const inner = raw.slice(1, -1);
  let value = "";
  for (let index = 0; index < inner.length; index++) {
    const character = inner[index];
    if (character !== "\\") {
      value += character;
      continue;
    }
    const escape = inner[++index];
    const simple = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0" };
    if (escape in simple) {
      value += simple[escape];
    } else if (escape === "x") {
      value += String.fromCharCode(parseInt(inner.slice(index + 1, index + 3), 16));
      index += 2;
    } else if (escape === "u") {
      if (inner[index + 1] === "{") {
        const close = inner.indexOf("}", index);
        value += String.fromCodePoint(parseInt(inner.slice(index + 2, close), 16));
        index = close;
      } else {
        value += String.fromCharCode(parseInt(inner.slice(index + 1, index + 5), 16));
        index += 4;
      }
    } else if (escape === "\r" || escape === "\n") {
      if (escape === "\r" && inner[index + 1] === "\n") {
        index++;
      }
    } else {
      value += escape;
    }
  }
  return value;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
  constructor(source, typescript) {
    this.source = source;
    this.ts = typescript;
    this.pos = 0;
    this.tok = null;
    this.prevEnd = 0;
    this.newlineBefore = false;
    this.comments = [];
    this.commentIndex = 0;
    this.inAsync = true;
    this.inGenerator = false;
    this.noIn = false;
    this.noConditionalType = false;
  }

  // ----- state, speculation -----

  save() {
    return {
      pos: this.pos,
      tok: this.tok,
      prevEnd: this.prevEnd,
      commentCount: this.comments.length,
      commentIndex: this.commentIndex,
      inAsync: this.inAsync,
      inGenerator: this.inGenerator,
      noIn: this.noIn,
      noConditionalType: this.noConditionalType,
    };
  }

  restore(state) {
    const { commentCount, ...rest } = state;
    Object.assign(this, rest);
    this.comments.length = commentCount;
  }

  tryParse(parse) {
    const state = this.save();
    try {
      const result = parse();
      if (result) {
        return result;
      }
    } catch (error) {
      if (!(error instanceof SyntaxFailure)) {
        throw error;
      }
    }
    this.restore(state);
    return null;
  }

  peekToken() {
    const state = this.save();
    this.next();
    const token = this.tok;
    this.restore(state);
    return token;
  }

  withFlags(flags, parse) {
    const saved = {};
    for (const name of Object.keys(flags)) {
      saved[name] = this[name];
    }
    Object.assign(this, flags);
    try {
      return parse();
    } finally {
      Object.assign(this, saved);
    }
  }

  // ----- tokenizer -----

  fail(message, offset = this.tok.start) {
    throw new SyntaxFailure(message, offset);
  }

  unexpected(expected) {
    const token = this.tok;
    const found =
      token.type === "eof" ? "end of input" : `"${this.source.slice(token.start, token.end)}"`;
    this.fail(expected ? `Expected ${expected} but found ${found}` : `Unexpected ${found}`);
  }

  next() {
    this.prevEnd = this.tok ? this.tok.end : 0;
    this.tok = this.readToken();
  }

  skipTrivia() {
    const { source } = this;
    let sawNewline = false;
    for (;;) {
      const code = source.charCodeAt(this.pos);
      if (code === 10 || code === 13 || code === 0x2028 || code === 0x2029) {
        sawNewline = true;
        this.pos++;
      } else if (code === 32 || code === 9 || code === 11 || code === 12) {
        this.pos++;
      } else if (code > 127 && /\s/.test(source[this.pos])) {
        this.pos++;
      } else if (code === 47 && source.charCodeAt(this.pos + 1) === 47) {
        this.readComment("Line", this.pos, this.lineCommentEnd(this.pos), sawNewline);
      } else if (code === 47 && source.charCodeAt(this.pos + 1) === 42) {
        const close = source.indexOf("*/", this.pos + 2);
        if (close === -1) {
          this.fail("Unterminated comment", this.pos);
        }
        const comment = this.readComment("Block", this.pos, close + 2, sawNewline);
        sawNewline ||= /[\n\r\u2028\u2029]/.test(comment.raw);
      } else if (code === 35 && this.pos === 0 && source.charCodeAt(1) === 33) {
        this.readComment("Line", 0, this.lineCommentEnd(0), false);
      } else {
        break;
      }
    }
    this.newlineBefore = sawNewline;
  }

  lineCommentEnd(from) {
    let end = from;
    while (end < this.source.length && !/[\n\r\u2028\u2029]/.test(this.source[end])) {
      end++;
    }
    return end;
  }

  readComment(type, start, end, sawNewline) {
    const comment = {
      type,
      raw: this.source.slice(start, end),
      start,
      end,
      sameLine: !sawNewline && this.tok !== null,
      blankBefore: false,
    };
    this.comments.push(comment);
    this.pos = end;
    return comment;
  }

  readToken() {
    this.skipTrivia();
    const { source } = this;
    const start = this.pos;
    const nl = this.newlineBefore;
    const make = (type, end) => {
      this.pos = end;
      return { type, value: source.slice(start, end), start, end, nl };
    };
    if (start >= source.length) {
      return { type: "eof", value: "", start, end: start, nl };
    }
    const character = source[start];
    const idLength = identifierStartLength(source, start);
    if (idLength) {
      let end = start + idLength;
      for (let length; (length = identifierPartLength(source, end)); end += length);
      return make("name", end);
    }
    if ((character >= "0" && character <= "9") || (character === "." && /\d/.test(source[start + 1] ?? ""))) {
      NUMBER_PATTERN.lastIndex = start;
      const match = NUMBER_PATTERN.exec(source);
      return make("num", start + match[0].length);
    }
    if (character === '"' || character === "'") {
      return make("string", this.stringEnd(start, character));
    }
    if (character === "`") {
      return make("template", start + 1);
    }
    if (character === "#" && identifierStartLength(source, start + 1)) {
      let end = start + 1;
      for (let length; (length = identifierPartLength(source, end)); end += length);
      return make("private", end);
    }
    for (let length = 4; length >= 1; length--) {
      const candidate = source.slice(start, start + length);
      if (!PUNCTUATORS_BY_LENGTH[length].has(candidate)) {
        continue;
      }
      if (candidate === "?." && /\d/.test(source[start + 2] ?? "")) {
        continue;
      }
      return make("punct", start + length);
    }
    this.fail(`Unexpected character "${character}"`, start);
  }

  stringEnd(start, quote) {
    const { source } = this;
    let index = start + 1;
    for (;;) {
      const character = source[index];
      if (character === undefined || character === "\n" || character === "\r") {
        this.fail("Unterminated string", start);
      }
      if (character === "\\") {
        index += source[index + 1] === "\r" && source[index + 2] === "\n" ? 3 : 2;
      } else if (character === quote) {
        return index + 1;
      } else {
        index++;
      }
    }
  }

  scanTemplateChunk(from) {
    const { source } = this;
    let index = from;
    for (;;) {
      if (index >= source.length) {
        this.fail("Unterminated template literal", from);
      }
      const character = source[index];
      if (character === "`") {
        return { raw: source.slice(from, index), end: index + 1, closed: true };
      }
      if (character === "$" && source[index + 1] === "{") {
        return { raw: source.slice(from, index), end: index + 2, closed: false };
      }
      index += character === "\\" ? 2 : 1;
    }
  }

  rescanAsRegex() {
    const { source } = this;
    const start = this.tok.start;
    let index = start + 1;
    let inClass = false;
    for (;;) {
      const character = source[index];
      if (character === undefined || character === "\n" || character === "\r") {
        this.fail("Unterminated regular expression", start);
      }
      index++;
      if (character === "\\") {
        index++;
      } else if (character === "[") {
        inClass = true;
      } else if (character === "]") {
        inClass = false;
      } else if (character === "/" && !inClass) {
        break;
      }
    }
    for (let length; (length = identifierPartLength(source, index)); index += length);
    this.pos = index;
    this.tok = { type: "regex", value: source.slice(start, index), start, end: index, nl: this.tok.nl };
  }

  // ----- token helpers -----

  isPunct(value) {
    return this.tok.type === "punct" && this.tok.value === value;
  }

  isWord(value) {
    return this.tok.type === "name" && this.tok.value === value;
  }

  eatPunct(value) {
    if (this.isPunct(value)) {
      this.next();
      return true;
    }
    return false;
  }

  eatWord(value) {
    if (this.isWord(value)) {
      this.next();
      return true;
    }
    return false;
  }

  expectPunct(value) {
    if (!this.eatPunct(value)) {
      this.unexpected(`"${value}"`);
    }
  }

  expectWord(value) {
    if (!this.eatWord(value)) {
      this.unexpected(`"${value}"`);
    }
  }

  consumeSemicolon() {
    if (this.eatPunct(";") || this.isPunct("}") || this.tok.type === "eof" || this.tok.nl) {
      return;
    }
    this.unexpected('";"');
  }

  // Splits `>>`, `>=` and friends so nested generics can close one `>` at a time.
  expectTypeClose() {
    const token = this.tok;
    if (token.type !== "punct" || token.value[0] !== ">") {
      this.unexpected('">"');
    }
    this.pos = token.start + 1;
    this.tok = { ...token, value: ">", end: token.start + 1 };
    this.next();
  }

  startNode() {
    return { type: "", start: this.tok.start, end: 0 };
  }

  startNodeAt(node) {
    return { type: "", start: node.start, end: 0 };
  }

  finish(node, type) {
    node.type = type;
    node.end = this.prevEnd;
    return node;
  }

  // ----- comment attachment -----

  hasBlankLine(from, to) {
    if (to <= from) {
      return false;
    }
    const gap = this.source.slice(from, to);
    return (gap.match(/\n/g)?.length ?? 0) >= 2;
  }

  // Comments before the current token become trailing comments of `previousItem`
  // when they share its line, otherwise leading comments of the next item.
  claimComments(previousItem) {
    const comments = [];
    let position = this.prevEnd;
    let canTrail = Boolean(previousItem);
    while (
      this.commentIndex < this.comments.length &&
      this.comments[this.commentIndex].start < this.tok.start
    ) {
      const comment = this.comments[this.commentIndex++];
      if (canTrail && comment.sameLine && comment.start >= this.prevEnd) {
        (previousItem.trailingComments ??= []).push(comment);
      } else {
        canTrail = false;
        comment.blankBefore = this.hasBlankLine(position, comment.start);
        comments.push(comment);
      }
      position = Math.max(position, comment.end);
    }
    return { comments, blankBefore: this.hasBlankLine(position, this.tok.start) };
  }

  parseItems(isEnd, parseItem, separator) {
    const items = [];
    for (;;) {
      const claimed = this.claimComments(items.at(-1));
      if (isEnd()) {
        return { items, dangling: claimed.comments };
      }
      const item = parseItem();
      if (claimed.comments.length) {
        item.leadingComments = claimed.comments;
      }
      if (claimed.blankBefore) {
        item.blankBefore = true;
      }
      items.push(item);
      separator?.();
    }
  }

  commaSeparator(closer) {
    return () => {
      if (!this.eatPunct(",") && !this.isPunct(closer)) {
        this.unexpected(`"," or "${closer}"`);
      }
    };
  }

  parseCommaList(closer, parseItem) {
    const { items, dangling } = this.parseItems(
      () => this.isPunct(closer),
      parseItem,
      this.commaSeparator(closer),
    );
    return { items, dangling };
  }

  setDangling(node, dangling) {
    if (dangling.length) {
      node.danglingComments = dangling;
    }
  }

  // ----- program and statements -----

  parseProgram() {
    const node = { type: "Program", start: 0, end: this.source.length, sourceType: "module", body: [] };
    this.next();
    const { items, dangling } = this.parseItems(
      () => this.tok.type === "eof",
      () => this.parseStatement(),
    );
    node.body = items;
    this.setDangling(node, dangling);
    return node;
  }

  isVariableStart() {
    if (this.isWord("var") || this.isWord("const")) {
      return true;
    }
    if (this.isWord("let")) {
      const after = this.peekToken();
      return (
        (after.type === "name" && after.value !== "in" && after.value !== "of" && after.value !== "instanceof") ||
        (after.type === "punct" && (after.value === "[" || after.value === "{"))
      );
    }
    return false;
  }

  parseStatement() {
    const token = this.tok;
    if (token.type === "punct") {
      if (token.value === "{") {
        return this.parseBlock();
      }
      if (token.value === ";") {
        const node = this.startNode();
        this.next();
        return this.finish(node, "EmptyStatement");
      }
      if (token.value === "@") {
        this.fail("Decorators are not supported");
      }
    } else if (token.type === "name") {
      const statement = this.parseKeywordStatement(token);
      if (statement) {
        return statement;
      }
    }
    return this.parseExpressionStatement();
  }

  parseKeywordStatement(token) {
    const word = token.value;
    switch (word) {
      case "var":
      case "let":
      case "const": {
        if (word === "const" && this.ts && this.peekToken().value === "enum") {
          return this.parseEnum({ isConst: true });
        }
        if (this.isVariableStart()) {
          return this.parseVariableStatement();
        }
        break;
      }
      case "function":
        return this.parseFunction({ declaration: true });
      case "async": {
        const after = this.peekToken();
        if (after.type === "name" && after.value === "function" && !after.nl) {
          return this.parseFunction({ declaration: true });
        }
        break;
      }
      case "class":
        return this.parseClass({ declaration: true });
      case "if":
        return this.parseIf();
      case "for":
        return this.parseFor();
      case "while": {
        const node = this.startNode();
        this.next();
        node.test = this.parseParenthesizedExpression();
        node.body = this.parseStatement();
        return this.finish(node, "WhileStatement");
      }
      case "do": {
        const node = this.startNode();
        this.next();
        node.body = this.parseStatement();
        this.expectWord("while");
        node.test = this.parseParenthesizedExpression();
        this.eatPunct(";");
        return this.finish(node, "DoWhileStatement");
      }
      case "return": {
        const node = this.startNode();
        this.next();
        node.argument = this.endsStatement() ? null : this.parseExpression();
        this.consumeSemicolon();
        return this.finish(node, "ReturnStatement");
      }
      case "throw": {
        const node = this.startNode();
        this.next();
        node.argument = this.parseExpression();
        this.consumeSemicolon();
        return this.finish(node, "ThrowStatement");
      }
      case "break":
      case "continue": {
        const node = this.startNode();
        this.next();
        node.label = this.tok.type === "name" && !this.tok.nl && !RESERVED_WORDS.has(this.tok.value)
          ? this.parseIdentifier()
          : null;
        this.consumeSemicolon();
        return this.finish(node, word === "break" ? "BreakStatement" : "ContinueStatement");
      }
      case "debugger": {
        const node = this.startNode();
        this.next();
        this.consumeSemicolon();
        return this.finish(node, "DebuggerStatement");
      }
      case "try":
        return this.parseTry();
      case "switch":
        return this.parseSwitch();
      case "import": {
        const after = this.peekToken();
        if (after.type === "punct" && (after.value === "(" || after.value === ".")) {
          break;
        }
        return this.parseImport();
      }
      case "export":
        return this.parseExport();
      default:
        break;
    }
    if (this.ts) {
      const statement = this.parseTypeScriptStatement(word);
      if (statement) {
        return statement;
      }
    }
    if (word === "enum") {
      return this.parseEnum({});
    }
    if (!RESERVED_WORDS.has(word)) {
      const after = this.peekToken();
      if (after.type === "punct" && after.value === ":") {
        const node = this.startNode();
        node.label = this.parseIdentifier();
        this.expectPunct(":");
        node.body = this.parseStatement();
        return this.finish(node, "LabeledStatement");
      }
    }
    return null;
  }

  endsStatement() {
    return this.isPunct(";") || this.isPunct("}") || this.tok.type === "eof" || this.tok.nl;
  }

  parseExpressionStatement() {
    const node = this.startNode();
    node.expression = this.parseExpression();
    this.consumeSemicolon();
    return this.finish(node, "ExpressionStatement");
  }

  parseBlock() {
    const node = this.startNode();
    this.expectPunct("{");
    const { items, dangling } = this.parseItems(
      () => this.isPunct("}"),
      () => this.parseStatement(),
    );
    this.expectPunct("}");
    node.body = items;
    this.setDangling(node, dangling);
    return this.finish(node, "BlockStatement");
  }

  parseParenthesizedExpression() {
    this.expectPunct("(");
    const expression = this.withFlags({ noIn: false }, () => this.parseExpression());
    this.expectPunct(")");
    return expression;
  }

  parseVariableStatement() {
    const node = this.parseVariableDeclaration();
    this.consumeSemicolon();
    node.end = this.prevEnd;
    return node;
  }

  parseVariableDeclaration() {
    const node = this.startNode();
    node.kind = this.tok.value;
    this.next();
    node.declarations = [];
    do {
      const declarator = this.startNode();
      declarator.id = this.parseBindingTarget();
      if (this.ts) {
        if (this.eatPunct("!")) {
          declarator.definite = true;
        }
        if (this.isPunct(":")) {
          declarator.id.typeAnnotation = this.parseTypeAnnotation();
        }
      }
      declarator.init = this.eatPunct("=") ? this.parseAssign() : null;
      node.declarations.push(this.finish(declarator, "VariableDeclarator"));
    } while (this.eatPunct(","));
    return this.finish(node, "VariableDeclaration");
  }

  parseIf() {
    const node = this.startNode();
    this.next();
    node.test = this.parseParenthesizedExpression();
    node.consequent = this.parseStatement();
    node.alternate = this.eatWord("else") ? this.parseStatement() : null;
    return this.finish(node, "IfStatement");
  }

  parseFor() {
    const node = this.startNode();
    this.next();
    node.await = this.eatWord("await");
    this.expectPunct("(");
    let init = null;
    if (!this.isPunct(";")) {
      init = this.withFlags({ noIn: true }, () =>
        this.isVariableStart() ? this.parseVariableDeclaration() : this.parseExpression(),
      );
      const isOf = this.isWord("of");
      if (isOf || this.isWord("in")) {
        this.next();
        node.left = init.type === "VariableDeclaration" ? init : this.toPattern(init);
        node.right = isOf ? this.parseAssign() : this.parseExpression();
        this.expectPunct(")");
        node.body = this.parseStatement();
        return this.finish(node, isOf ? "ForOfStatement" : "ForInStatement");
      }
    }
    delete node.await;
    node.init = init;
    this.expectPunct(";");
    node.test = this.isPunct(";") ? null : this.parseExpression();
    this.expectPunct(";");
    node.update = this.isPunct(")") ? null : this.parseExpression();
    this.expectPunct(")");
    node.body = this.parseStatement();
    return this.finish(node, "ForStatement");
  }

  parseTry() {
    const node = this.startNode();
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.isWord("catch")) {
      const handler = this.startNode();
      this.next();
      handler.param = null;
      if (this.eatPunct("(")) {
        handler.param = this.parseBindingTarget();
        if (this.ts && this.isPunct(":")) {
          handler.param.typeAnnotation = this.parseTypeAnnotation();
        }
        this.expectPunct(")");
      }
      handler.body = this.parseBlock();
      node.handler = this.finish(handler, "CatchClause");
    }
    node.finalizer = this.eatWord("finally") ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) {
      this.unexpected('"catch" or "finally"');
    }
    return this.finish(node, "TryStatement");
  }

  parseSwitch() {
    const node = this.startNode();
    this.next();
    node.discriminant = this.parseParenthesizedExpression();
    this.expectPunct("{");
    const { items, dangling } = this.parseItems(
      () => this.isPunct("}"),
      () => this.parseSwitchCase(),
    );
    this.expectPunct("}");
    node.cases = items;
    this.setDangling(node, dangling);
    return this.finish(node, "SwitchStatement");
  }

  parseSwitchCase() {
    const node = this.startNode();
    if (this.eatWord("default")) {
      node.test = null;
    } else {
      this.expectWord("case");
      node.test = this.parseExpression();
    }
    this.expectPunct(":");
    const { items, dangling } = this.parseItems(
      () => this.isPunct("}") || this.isWord("case") || this.isWord("default"),
      () => this.parseStatement(),
    );
    node.consequent = items;
    this.setDangling(node, dangling);
    return this.finish(node, "SwitchCase");
  }

  // ----- modules -----

  parseModuleName() {
    if (this.tok.type === "string") {
      return this.parseLiteral();
    }
    if (this.tok.type !== "name") {
      this.unexpected("a name");
    }
    return this.parseIdentifier({ allowReserved: true });
  }

  parseImport() {
    const node = this.startNode();
    this.next();
    node.importKind = "value";
    node.specifiers = [];
    if (this.tok.type !== "string") {
      if (this.ts && this.isWord("type")) {
        const after = this.peekToken();
        const isTypeImport =
          (after.type === "punct" && (after.value === "{" || after.value === "*")) ||
          (after.type === "name" && after.value !== "from");
        if (isTypeImport) {
          this.next();
          node.importKind = "type";
        }
      }
      if (this.tok.type === "name") {
        const specifier = this.startNode();
        specifier.local = this.parseIdentifier();
        node.specifiers.push(this.finish(specifier, "ImportDefaultSpecifier"));
        if (!this.eatPunct(",")) {
          this.expectWord("from");
          return this.finishImport(node);
        }
      }
      if (this.isPunct("*")) {
        const specifier = this.startNode();
        this.next();
        this.expectWord("as");
        specifier.local = this.parseIdentifier();
        node.specifiers.push(this.finish(specifier, "ImportNamespaceSpecifier"));
      } else {
        this.expectPunct("{");
        const { items, dangling } = this.parseCommaList("}", () => this.parseImportSpecifier());
        this.expectPunct("}");
        node.specifiers.push(...items);
        this.setDangling(node, dangling);
      }
      this.expectWord("from");
    }
    return this.finishImport(node);
  }

  finishImport(node) {
    node.source = this.parseLiteral();
    this.parseImportAttributes(node);
    this.consumeSemicolon();
    return this.finish(node, "ImportDeclaration");
  }

  parseImportAttributes(node) {
    if (this.isWord("with") || (this.isWord("assert") && !this.tok.nl)) {
      node.attributesKeyword = this.tok.value;
      this.next();
      node.attributes = this.parseObject();
    }
  }

  parseImportSpecifier() {
    const node = this.startNode();
    node.importKind = "value";
    if (this.ts && this.isWord("type")) {
      const after = this.peekToken();
      const isModifier =
        after.type === "string" ||
        (after.type === "name" && after.value !== "as") ||
        (after.type === "name" && after.value === "as" && this.peekIsTypeThenAsName());
      if (isModifier) {
        this.next();
        node.importKind = "type";
      }
    }
    node.imported = this.parseModuleName();
    node.local = this.eatWord("as") ? this.parseIdentifier() : { ...node.imported };
    return this.finish(node, "ImportSpecifier");
  }

  // Distinguishes `type as as x` from `type as`.
  peekIsTypeThenAsName() {
    const state = this.save();
    this.next();
    this.next();
    const isAsName = this.isWord("as");
    this.restore(state);
    return isAsName;
  }

  parseExport() {
    const node = this.startNode();
    this.next();
    node.exportKind = "value";
    if (this.isPunct("*")) {
      this.next();
      node.exported = this.eatWord("as") ? this.parseModuleName() : null;
      this.expectWord("from");
      node.source = this.parseLiteral();
      this.parseImportAttributes(node);
      this.consumeSemicolon();
      return this.finish(node, "ExportAllDeclaration");
    }
    if (this.isWord("default")) {
      this.next();
      node.declaration = this.parseExportDefaultDeclaration();
      return this.finish(node, "ExportDefaultDeclaration");
    }
    if (this.ts && this.isWord("type")) {
      const after = this.peekToken();
      if (after.type === "punct" && (after.value === "{" || after.value === "*")) {
        this.next();
        node.exportKind = "type";
        if (this.isPunct("*")) {
          this.next();
          node.exported = this.eatWord("as") ? this.parseModuleName() : null;
          this.expectWord("from");
          node.source = this.parseLiteral();
          this.consumeSemicolon();
          return this.finish(node, "ExportAllDeclaration");
        }
      }
    }
    if (this.isPunct("{")) {
      this.next();
      const { items, dangling } = this.parseCommaList("}", () => this.parseExportSpecifier());
      this.expectPunct("}");
      node.specifiers = items;
      this.setDangling(node, dangling);
      node.declaration = null;
      node.source = null;
      if (this.eatWord("from")) {
        node.source = this.parseLiteral();
        this.parseImportAttributes(node);
      }
      this.consumeSemicolon();
      return this.finish(node, "ExportNamedDeclaration");
    }
    node.specifiers = [];
    node.source = null;
    node.declaration = this.parseStatement();
    return this.finish(node, "ExportNamedDeclaration");
  }

  parseExportDefaultDeclaration() {
    if (this.isWord("function") || (this.isWord("async") && this.peekToken().value === "function")) {
      return this.parseFunction({ declaration: true, idOptional: true });
    }
    if (this.isWord("class")) {
      return this.parseClass({ declaration: true, idOptional: true });
    }
    if (this.ts && this.isWord("abstract") && this.peekToken().value === "class") {
      return this.parseTypeScriptStatement("abstract");
    }
    if (this.ts && this.isWord("interface")) {
      return this.parseInterface();
    }
    const expression = this.parseAssign();
    this.consumeSemicolon();
    return expression;
  }

  parseExportSpecifier() {
    const node = this.startNode();
    node.exportKind = "value";
    if (this.ts && this.isWord("type")) {
      const after = this.peekToken();
      if (after.type === "string" || (after.type === "name" && after.value !== "as")) {
        this.next();
        node.exportKind = "type";
      }
    }
    node.local = this.parseModuleName();
    node.exported = this.eatWord("as") ? this.parseModuleName() : { ...node.local };
    return this.finish(node, "ExportSpecifier");
  }

  // ----- functions -----

  parseIdentifier({ allowReserved = false } = {}) {
    if (this.tok.type !== "name" || (!allowReserved && RESERVED_WORDS.has(this.tok.value))) {
      this.unexpected("an identifier");
    }
    const node = this.startNode();
    node.name = this.tok.value;
    this.next();
    return this.finish(node, "Identifier");
  }

  parseFunction({ declaration, idOptional = false }) {
    const node = this.startNode();
    const isAsync = this.eatWord("async");
    this.expectWord("function");
    const isGenerator = this.eatPunct("*");
    node.id = null;
    if (this.tok.type === "name" && !this.isPunct("(")) {
      node.id = this.parseIdentifier();
    } else if (declaration && !idOptional) {
      this.unexpected("a function name");
    }
    this.parseFunctionRest(node, isAsync, isGenerator);
    if (!node.body) {
      this.consumeSemicolon();
      node.end = this.prevEnd;
    }
    return this.finish(node, declaration ? "FunctionDeclaration" : "FunctionExpression");
  }

  parseFunctionRest(node, isAsync, isGenerator) {
    node.async = isAsync;
    node.generator = isGenerator;
    node.typeParameters = this.ts && this.isPunct("<") ? this.parseTypeParameters() : null;
    this.withFlags({ inAsync: isAsync, inGenerator: isGenerator }, () => {
      this.parseParams(node);
      node.returnType = this.ts && this.isPunct(":") ? this.parseTypeAnnotation({ returnType: true }) : null;
      node.body = this.isPunct("{") || !this.ts ? this.parseFunctionBody() : null;
    });
  }

  parseFunctionBody() {
    return this.withFlags({ noIn: false }, () => this.parseBlock());
  }

  parseParams(node) {
    this.expectPunct("(");
    const { items, dangling } = this.parseCommaList(")", () => this.parseParam());
    this.expectPunct(")");
    node.params = items;
    this.setDangling(node, dangling);
  }

  parseParam() {
    const node = this.startNode();
    let accessibility = null;
    let readonly = false;
    let override = false;
    while (this.ts && this.tok.type === "name" && /^(public|private|protected|readonly|override)$/.test(this.tok.value)) {
      const after = this.peekToken();
      const startsBinding = after.type === "name" || (after.type === "punct" && (after.value === "{" || after.value === "["));
      if (!startsBinding) {
        break;
      }
      if (this.tok.value === "readonly") {
        readonly = true;
      } else if (this.tok.value === "override") {
        override = true;
      } else {
        accessibility = this.tok.value;
      }
      this.next();
    }
    let parameter;
    if (this.isPunct("...")) {
      const rest = this.startNode();
      this.next();
      rest.argument = this.parseBindingTarget();
      if (this.ts && this.isPunct(":")) {
        rest.typeAnnotation = this.parseTypeAnnotation();
      }
      parameter = this.finish(rest, "RestElement");
    } else {
      parameter = this.parseBindingTarget();
      if (this.ts) {
        if (this.eatPunct("?")) {
          parameter.optional = true;
        }
        if (this.isPunct(":")) {
          parameter.typeAnnotation = this.parseTypeAnnotation();
        }
      }
      if (this.eatPunct("=")) {
        const pattern = this.startNodeAt(parameter);
        pattern.left = parameter;
        pattern.right = this.parseAssign();
        parameter = this.finish(pattern, "AssignmentPattern");
      }
    }
    if (accessibility || readonly || override) {
      node.parameter = parameter;
      node.accessibility = accessibility;
      node.readonly = readonly;
      node.override = override;
      return this.finish(node, "TSParameterProperty");
    }
    return parameter;
  }

  parseBindingTarget() {
    if (this.isPunct("[")) {
      const node = this.startNode();
      this.next();
      const { items, dangling } = this.parseCommaList("]", () => {
        if (this.isPunct(",")) {
          return this.finish(this.startNode(), "Hole");
        }
        return this.parseBindingElement();
      });
      this.expectPunct("]");
      node.elements = items.map((item) => (item.type === "Hole" ? null : item));
      this.setDangling(node, dangling);
      return this.finish(node, "ArrayPattern");
    }
    if (this.isPunct("{")) {
      const node = this.startNode();
      this.next();
      const { items, dangling } = this.parseCommaList("}", () => this.parseObjectPatternProperty());
      this.expectPunct("}");
      node.properties = items;
      this.setDangling(node, dangling);
      return this.finish(node, "ObjectPattern");
    }
    if (this.ts && this.isWord("this")) {
      return this.parseIdentifier({ allowReserved: true });
    }
    return this.parseIdentifier();
  }

  parseBindingElement() {
    if (this.isPunct("...")) {
      const rest = this.startNode();
      this.next();
      rest.argument = this.parseBindingTarget();
      return this.finish(rest, "RestElement");
    }
    const target = this.parseBindingTarget();
    if (!this.eatPunct("=")) {
      return target;
    }
    const pattern = this.startNodeAt(target);
    pattern.left = target;
    pattern.right = this.parseAssign();
    return this.finish(pattern, "AssignmentPattern");
  }

  parseObjectPatternProperty() {
    if (this.isPunct("...")) {
      return this.parseBindingElement();
    }
    const node = this.startNode();
    const { key, computed } = this.parsePropertyKey();
    node.kind = "init";
    node.method = false;
    node.key = key;
    node.computed = computed;
    if (this.eatPunct(":")) {
      node.shorthand = false;
      node.value = this.parseBindingElement();
    } else {
      node.shorthand = true;
      node.value = { ...key };
      if (this.eatPunct("=")) {
        const pattern = this.startNodeAt(key);
        pattern.left = node.value;
        pattern.right = this.parseAssign();
        node.value = this.finish(pattern, "AssignmentPattern");
      }
    }
    return this.finish(node, "Property");
  }

  parsePropertyKey() {
    const token = this.tok;
    if (this.isPunct("[")) {
      this.next();
      const key = this.withFlags({ noIn: false }, () => this.parseAssign());
      this.expectPunct("]");
      return { key, computed: true };
    }
    if (token.type === "string" || token.type === "num") {
      return { key: this.parseLiteral(), computed: false };
    }
    if (token.type === "private") {
      const key = this.startNode();
      key.name = token.value.slice(1);
      this.next();
      return { key: this.finish(key, "PrivateIdentifier"), computed: false };
    }
    if (token.type === "name") {
      return { key: this.parseIdentifier({ allowReserved: true }), computed: false };
    }
    this.unexpected("a property name");
  }

  // ----- expressions -----

  parseExpression() {
    const first = this.parseAssign();
    if (!this.isPunct(",")) {
      return first;
    }
    const node = this.startNodeAt(first);
    node.expressions = [first];
    while (this.eatPunct(",")) {
      node.expressions.push(this.parseAssign());
    }
    return this.finish(node, "SequenceExpression");
  }

  parseAssign() {
    if (this.inGenerator && this.isWord("yield")) {
      return this.parseYield();
    }
    const left = this.parseConditional();
    if (this.tok.type === "punct" && ASSIGNMENT_OPERATORS.has(this.tok.value)) {
      const node = this.startNodeAt(left);
      node.operator = this.tok.value;
      this.next();
      node.left = node.operator === "=" ? this.toPattern(left) : left;
      node.right = this.parseAssign();
      return this.finish(node, "AssignmentExpression");
    }
    return left;
  }

  parseYield() {
    const node = this.startNode();
    this.next();
    node.delegate = false;
    node.argument = null;
    if (!this.endsStatement() && !this.isPunct(")") && !this.isPunct("]") && !this.isPunct(",") && !this.isPunct(":")) {
      node.delegate = this.eatPunct("*");
      node.argument = this.parseAssign();
    }
    return this.finish(node, "YieldExpression");
  }

  toPattern(node) {
    switch (node.type) {
      case "ObjectExpression":
        node.type = "ObjectPattern";
        node.properties = node.properties.map((property) => {
          if (property.type === "SpreadElement") {
            property.type = "RestElement";
            property.argument = this.toPattern(property.argument);
          } else {
            property.value = this.toPattern(property.value);
          }
          return property;
        });
        return node;
      case "ArrayExpression":
        node.type = "ArrayPattern";
        node.elements = node.elements.map((element) => {
          if (element?.type === "SpreadElement") {
            element.type = "RestElement";
            element.argument = this.toPattern(element.argument);
            return element;
          }
          return element && this.toPattern(element);
        });
        return node;
      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern";
          delete node.operator;
          node.left = this.toPattern(node.left);
        }
        return node;
      default:
        return node;
    }
  }

  parseConditional() {
    const test = this.parseBinary(0);
    if (!this.isPunct("?")) {
      return test;
    }
    const node = this.startNodeAt(test);
    this.next();
    node.test = test;
    node.consequent = this.withFlags({ noIn: false }, () => this.parseAssign());
    this.expectPunct(":");
    node.alternate = this.parseAssign();
    return this.finish(node, "ConditionalExpression");
  }

  binaryOperator() {
    const token = this.tok;
    if (token.type === "punct") {
      return token.value in BINARY_PRECEDENCE ? token.value : null;
    }
    if (token.type !== "name") {
      return null;
    }
    if (token.value === "instanceof" || (token.value === "in" && !this.noIn)) {
      return token.value;
    }
    if (this.ts && !token.nl && (token.value === "as" || token.value === "satisfies")) {
      return token.value;
    }
    return null;
  }

  parseBinary(minimumPrecedence) {
    let left = this.tok.type === "private" ? this.parsePrivateName() : this.parseUnary();
    for (;;) {
      const operator = this.binaryOperator();
      const precedence = operator && BINARY_PRECEDENCE[operator];
      if (!operator || precedence <= minimumPrecedence) {
        return left;
      }
      const node = this.startNodeAt(left);
      this.next();
      node.left = left;
      if (operator === "as" || operator === "satisfies") {
        node.expression = left;
        delete node.left;
        node.typeAnnotation = this.parseType();
        left = this.finish(node, operator === "as" ? "TSAsExpression" : "TSSatisfiesExpression");
        continue;
      }
      node.operator = operator;
      node.right = this.parseBinary(operator === "**" ? precedence - 1 : precedence);
      const isLogical = operator === "&&" || operator === "||" || operator === "??";
      left = this.finish(node, isLogical ? "LogicalExpression" : "BinaryExpression");
    }
  }

  parsePrivateName() {
    const node = this.startNode();
    node.name = this.tok.value.slice(1);
    this.next();
    return this.finish(node, "PrivateIdentifier");
  }

  parseUnary() {
    const token = this.tok;
    if (token.type === "punct") {
      if (token.value === "!" || token.value === "~" || token.value === "+" || token.value === "-") {
        return this.parseUnaryOperator();
      }
      if (token.value === "++" || token.value === "--") {
        const node = this.startNode();
        node.operator = token.value;
        node.prefix = true;
        this.next();
        node.argument = this.parseUnary();
        return this.finish(node, "UpdateExpression");
      }
    } else if (token.type === "name") {
      if (token.value === "typeof" || token.value === "void" || token.value === "delete") {
        return this.parseUnaryOperator();
      }
      if (token.value === "await" && this.inAsync) {
        const node = this.startNode();
        this.next();
        node.argument = this.parseUnary();
        return this.finish(node, "AwaitExpression");
      }
    }
    const atom = this.parseAtom();
    if (atom.type === "ArrowFunctionExpression" && !atom.parenthesized) {
      return atom;
    }
    const expression = this.parseSubscripts(atom, false);
    if ((this.isPunct("++") || this.isPunct("--")) && !this.tok.nl) {
      const node = this.startNodeAt(expression);
      node.operator = this.tok.value;
      node.prefix = false;
      node.argument = expression;
      this.next();
      return this.finish(node, "UpdateExpression");
    }
    return expression;
  }

  parseUnaryOperator() {
    const node = this.startNode();
    node.operator = this.tok.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseUnary();
    return this.finish(node, "UnaryExpression");
  }

  parseSubscripts(base, noCalls) {
    let expression = base;
    for (;;) {
      const token = this.tok;
      if (token.type === "template") {
        const node = this.startNodeAt(expression);
        node.tag = expression;
        node.quasi = this.parseTemplate();
        expression = this.finish(node, "TaggedTemplateExpression");
      } else if (token.type !== "punct") {
        return expression;
      } else if (token.value === ".") {
        const node = this.startNodeAt(expression);
        this.next();
        node.object = expression;
        node.computed = false;
        node.optional = false;
        node.property = this.parseMemberName();
        expression = this.finish(node, "MemberExpression");
      } else if (token.value === "?.") {
        expression = this.parseOptionalChain(expression, noCalls);
      } else if (token.value === "[") {
        const node = this.startNodeAt(expression);
        this.next();
        node.object = expression;
        node.computed = true;
        node.optional = false;
        node.property = this.withFlags({ noIn: false }, () => this.parseExpression());
        this.expectPunct("]");
        expression = this.finish(node, "MemberExpression");
      } else if (token.value === "(" && !noCalls) {
        expression = this.parseCall(expression, null, false);
      } else if (token.value === "!" && this.ts && !token.nl) {
        const node = this.startNodeAt(expression);
        this.next();
        node.expression = expression;
        expression = this.finish(node, "TSNonNullExpression");
      } else if (token.value === "<" && this.ts && !noCalls) {
        const typeArguments = this.tryParse(() => {
          const parsed = this.parseTypeArguments();
          return this.isPunct("(") || this.tok.type === "template" ? parsed : null;
        });
        if (!typeArguments) {
          return expression;
        }
        if (this.tok.type === "template") {
          const node = this.startNodeAt(expression);
          node.tag = expression;
          node.typeArguments = typeArguments;
          node.quasi = this.parseTemplate();
          expression = this.finish(node, "TaggedTemplateExpression");
        } else {
          expression = this.parseCall(expression, typeArguments, false);
        }
      } else {
        return expression;
      }
    }
  }

  parseMemberName() {
    if (this.tok.type === "private") {
      return this.parsePrivateName();
    }
    return this.parseIdentifier({ allowReserved: true });
  }

  parseOptionalChain(object, noCalls) {
    const node = this.startNodeAt(object);
    this.next();
    if (this.isPunct("(") && !noCalls) {
      return this.parseCall(object, null, true, node);
    }
    node.object = object;
    node.optional = true;
    if (this.eatPunct("[")) {
      node.computed = true;
      node.property = this.withFlags({ noIn: false }, () => this.parseExpression());
      this.expectPunct("]");
    } else {
      node.computed = false;
      node.property = this.parseMemberName();
    }
    return this.finish(node, "MemberExpression");
  }

  parseCall(callee, typeArguments, optional, startedNode) {
    const node = startedNode ?? this.startNodeAt(callee);
    node.callee = callee;
    node.optional = optional;
    node.typeArguments = typeArguments;
    this.parseArguments(node);
    return this.finish(node, "CallExpression");
  }

  parseArguments(node) {
    this.expectPunct("(");
    const { items, dangling } = this.withFlags({ noIn: false }, () =>
      this.parseCommaList(")", () => this.parseSpreadOrAssign()),
    );
    this.expectPunct(")");
    node.arguments = items;
    this.setDangling(node, dangling);
  }

  parseSpreadOrAssign() {
    if (!this.isPunct("...")) {
      return this.parseAssign();
    }
    const node = this.startNode();
    this.next();
    node.argument = this.parseAssign();
    return this.finish(node, "SpreadElement");
  }

  parseLiteral() {
    const token = this.tok;
    const node = this.startNode();
    node.raw = token.value;
    if (token.type === "string") {
      node.kind = "string";
      node.value = decodeStringLiteral(token.value);
    } else if (token.type === "num") {
      const isBigInt = token.value.endsWith("n");
      node.kind = isBigInt ? "bigint" : "number";
      node.value = isBigInt ? token.value : Number(token.value.replaceAll("_", ""));
    } else {
      this.unexpected("a literal");
    }
    this.next();
    return this.finish(node, "Literal");
  }

  parseTemplate(parseInner = () => this.parseExpression()) {
    const node = this.startNode();
    node.quasis = [];
    node.expressions = [];
    let from = this.tok.end;
    for (;;) {
      const chunk = this.scanTemplateChunk(from);
      node.quasis.push(chunk.raw);
      this.pos = chunk.end;
      this.tok = { type: "template-part", value: "", start: from, end: chunk.end, nl: false };
      this.next();
      if (chunk.closed) {
        return this.finish(node, "TemplateLiteral");
      }
      node.expressions.push(this.withFlags({ noIn: false }, parseInner));
      if (!this.isPunct("}")) {
        this.unexpected('"}"');
      }
      from = this.tok.end;
    }
  }

  parseAtom() {
    const token = this.tok;
    switch (token.type) {
      case "num":
      case "string":
        return this.parseLiteral();
      case "template":
        return this.parseTemplate();
      case "private":
        return this.parsePrivateName();
      case "punct":
        return this.parsePunctuatorAtom(token);
      case "name":
        return this.parseWordAtom(token);
      default:
        return this.unexpected();
    }
  }

  parsePunctuatorAtom(token) {
    switch (token.value) {
      case "(":
        return this.parseParenthesizedOrArrow();
      case "[":
        return this.parseArray();
      case "{":
        return this.parseObject();
      case "/":
      case "/=": {
        const node = this.startNode();
        this.rescanAsRegex();
        node.kind = "regex";
        node.raw = this.tok.value;
        this.next();
        return this.finish(node, "Literal");
      }
      case "<": {
        const arrow = this.ts && this.tryParse(() => this.parseArrowFunction(false, this.tok.start));
        return arrow || this.unexpected();
      }
      default:
        return this.unexpected();
    }
  }

  parseWordAtom(token) {
    const word = token.value;
    switch (word) {
      case "function":
        return this.parseFunction({ declaration: false });
      case "class":
        return this.parseClass({ declaration: false });
      case "new":
        return this.parseNew();
      case "this":
      case "super": {
        const node = this.startNode();
        this.next();
        return this.finish(node, word === "this" ? "ThisExpression" : "Super");
      }
      case "null":
      case "true":
      case "false": {
        const node = this.startNode();
        node.raw = word;
        node.kind = word === "null" ? "null" : "boolean";
        node.value = word === "null" ? null : word === "true";
        this.next();
        return this.finish(node, "Literal");
      }
      case "import":
        return this.parseImportExpression();
      case "async": {
        const asyncExpression = this.parseAsyncAtom();
        if (asyncExpression) {
          return asyncExpression;
        }
        break;
      }
      default:
        break;
    }
    const identifier = this.parseIdentifier();
    if (this.isPunct("=>") && !this.tok.nl) {
      return this.parseArrowRest(this.startNodeAt(identifier), [identifier], false);
    }
    return identifier;
  }

  parseAsyncAtom() {
    const after = this.peekToken();
    if (after.nl) {
      return null;
    }
    if (after.type === "name" && after.value === "function") {
      return this.parseFunction({ declaration: false });
    }
    const start = this.tok.start;
    if (after.type === "punct" && (after.value === "(" || after.value === "<")) {
      return this.tryParse(() => {
        this.next();
        return this.parseArrowFunction(true, start);
      });
    }
    if (after.type === "name" && !RESERVED_WORDS.has(after.value)) {
      return this.tryParse(() => {
        this.next();
        const parameter = this.parseIdentifier();
        if (!this.isPunct("=>") || this.tok.nl) {
          return null;
        }
        return this.parseArrowRest({ type: "", start, end: 0 }, [parameter], true);
      });
    }
    return null;
  }

  parseImportExpression() {
    const node = this.startNode();
    this.next();
    if (this.eatPunct(".")) {
      node.meta = "import";
      node.property = this.parseIdentifier({ allowReserved: true });
      return this.finish(node, "MetaProperty");
    }
    const callee = this.finish({ type: "", start: node.start, end: 0 }, "Import");
    return this.parseCall(callee, null, false, node);
  }

  parseNew() {
    const node = this.startNode();
    this.next();
    if (this.eatPunct(".")) {
      node.meta = "new";
      node.property = this.parseIdentifier({ allowReserved: true });
      return this.finish(node, "MetaProperty");
    }
    node.callee = this.parseSubscripts(this.parseAtom(), true);
    node.typeArguments = null;
    if (this.ts && this.isPunct("<")) {
      node.typeArguments = this.tryParse(() => {
        const parsed = this.parseTypeArguments();
        return this.isPunct("(") ? parsed : null;
      });
    }
    if (this.isPunct("(")) {
      this.parseArguments(node);
    } else {
      node.arguments = [];
    }
    return this.finish(node, "NewExpression");
  }

  parseParenthesizedOrArrow() {
    const arrow = this.tryParse(() => this.parseArrowFunction(false, this.tok.start));
    if (arrow) {
      return arrow;
    }
    this.next();
    const expression = this.withFlags({ noIn: false }, () => this.parseExpression());
    this.expectPunct(")");
    expression.parenthesized = true;
    return expression;
  }

  parseArrowFunction(isAsync, start) {
    const node = { type: "", start, end: 0 };
    node.typeParameters = this.ts && this.isPunct("<") ? this.parseTypeParameters() : null;
    const params = {};
    this.withFlags({ inAsync: isAsync, inGenerator: false }, () => this.parseParams(params));
    node.returnType =
      this.ts && this.isPunct(":") ? this.withFlags({ inAsync: isAsync }, () => this.parseTypeAnnotation({ returnType: true })) : null;
    if (!this.isPunct("=>") || this.tok.nl) {
      return null;
    }
    if (params.danglingComments) {
      node.danglingComments = params.danglingComments;
    }
    return this.parseArrowRest(node, params.params, isAsync);
  }

  parseArrowRest(node, params, isAsync) {
    this.expectPunct("=>");
    node.async = isAsync;
    node.params = params;
    node.typeParameters ??= null;
    node.returnType ??= null;
    this.withFlags({ inAsync: isAsync, inGenerator: false }, () => {
      if (this.isPunct("{")) {
        node.body = this.parseFunctionBody();
        node.expression = false;
      } else {
        node.body = this.parseAssign();
        node.expression = true;
      }
    });
    return this.finish(node, "ArrowFunctionExpression");
  }

  parseArray() {
    const node = this.startNode();
    this.next();
    const { items, dangling } = this.withFlags({ noIn: false }, () =>
      this.parseCommaList("]", () => {
        if (this.isPunct(",")) {
          return this.finish(this.startNode(), "Hole");
        }
        return this.parseSpreadOrAssign();
      }),
    );
    this.expectPunct("]");
    node.elements = items.map((item) => (item.type === "Hole" ? null : item));
    this.setDangling(node, dangling);
    return this.finish(node, "ArrayExpression");
  }

  parseObject() {
    const node = this.startNode();
    this.expectPunct("{");
    const { items, dangling } = this.withFlags({ noIn: false }, () =>
      this.parseCommaList("}", () => this.parseObjectMember()),
    );
    this.expectPunct("}");
    node.properties = items;
    this.setDangling(node, dangling);
    return this.finish(node, "ObjectExpression");
  }

  // True when the token after a contextual word (get, set, async, static...) can start a member key.
  startsMemberKey(token, { allowStar }) {
    if (token.type === "name" || token.type === "string" || token.type === "num" || token.type === "private") {
      return true;
    }
    return token.type === "punct" && (token.value === "[" || (allowStar && token.value === "*"));
  }

  parseObjectMember() {
    if (this.isPunct("...")) {
      const spread = this.startNode();
      this.next();
      spread.argument = this.parseAssign();
      return this.finish(spread, "SpreadElement");
    }
    const node = this.startNode();
    let isAsync = false;
    let isGenerator = false;
    let kind = "init";
    if (this.isWord("async")) {
      const after = this.peekToken();
      if (!after.nl && this.startsMemberKey(after, { allowStar: true })) {
        this.next();
        isAsync = true;
      }
    }
    if (this.eatPunct("*")) {
      isGenerator = true;
    } else if (!isAsync && (this.isWord("get") || this.isWord("set"))) {
      if (this.startsMemberKey(this.peekToken(), { allowStar: false })) {
        kind = this.tok.value;
        this.next();
      }
    }
    const { key, computed } = this.parsePropertyKey();
    node.kind = kind;
    node.key = key;
    node.computed = computed;
    node.method = false;
    node.shorthand = false;
    if (this.isPunct("(") || (this.ts && this.isPunct("<"))) {
      node.method = kind === "init";
      node.value = this.parseMethodFunction(isAsync, isGenerator);
    } else if (this.eatPunct(":")) {
      node.value = this.parseAssign();
    } else {
      node.shorthand = true;
      node.value = { ...key };
      if (this.isPunct("=")) {
        this.next();
        const pattern = this.startNodeAt(key);
        pattern.left = node.value;
        pattern.right = this.parseAssign();
        node.value = this.finish(pattern, "AssignmentPattern");
      }
    }
    return this.finish(node, "Property");
  }

  parseMethodFunction(isAsync, isGenerator) {
    const fn = this.startNode();
    fn.id = null;
    this.parseFunctionRest(fn, isAsync, isGenerator);
    return this.finish(fn, "FunctionExpression");
  }

  // ----- classes -----

  parseClass({ declaration, idOptional = false }) {
    const node = this.startNode();
    this.next();
    node.id = null;
    node.abstract = false;
    if (this.tok.type === "name" && !this.isWord("extends") && !(this.ts && this.isWord("implements"))) {
      node.id = this.parseIdentifier();
    } else if (declaration && !idOptional) {
      this.unexpected("a class name");
    }
    node.typeParameters = this.ts && this.isPunct("<") ? this.parseTypeParameters() : null;
    node.superClass = null;
    node.superTypeArguments = null;
    if (this.eatWord("extends")) {
      node.superClass = this.parseSubscripts(this.parseAtom(), false);
      if (this.ts && this.isPunct("<")) {
        node.superTypeArguments = this.parseTypeArguments();
      }
    }
    node.implements = [];
    if (this.ts && this.eatWord("implements")) {
      do {
        node.implements.push(this.parseTypeReference());
      } while (this.eatPunct(","));
    }
    this.expectPunct("{");
    const { items, dangling } = this.parseItems(
      () => {
        while (this.eatPunct(";"));
        return this.isPunct("}");
      },
      () => this.parseClassMember(),
    );
    this.expectPunct("}");
    node.body = items;
    this.setDangling(node, dangling);
    return this.finish(node, declaration ? "ClassDeclaration" : "ClassExpression");
  }

  parseClassMember() {
    const node = this.startNode();
    if (this.isPunct("@")) {
      this.fail("Decorators are not supported");
    }
    const flags = { static: false, async: false, kind: "method" };
    const typeScriptModifiers = new Set(["declare", "abstract", "override", "readonly", "public", "private", "protected", "accessor"]);
    while (this.tok.type === "name") {
      const word = this.tok.value;
      const isModifierWord =
        word === "static" || word === "async" || word === "get" || word === "set" || (this.ts && typeScriptModifiers.has(word));
      if (!isModifierWord) {
        break;
      }
      const after = this.peekToken();
      const isOwnName =
        after.type === "eof" ||
        (after.type === "punct" && ["(", "=", ";", "}", ",", ":", "?", "!", "<"].includes(after.value));
      if (isOwnName || (word === "async" && after.nl)) {
        break;
      }
      if (word === "static" && after.type === "punct" && after.value === "{") {
        this.next();
        const block = this.parseBlock();
        node.body = block.body;
        if (block.danglingComments) {
          node.danglingComments = block.danglingComments;
        }
        return this.finish(node, "StaticBlock");
      }
      this.next();
      if (word === "get" || word === "set") {
        flags.kind = word;
        break;
      }
      flags[word] = true;
    }
    if (this.ts && this.tryParseIndexSignature(node)) {
      node.static = flags.static;
      node.readonly = Boolean(flags.readonly);
      this.consumeSemicolon();
      return this.finish(node, "TSIndexSignature");
    }
    const isGenerator = this.eatPunct("*");
    const { key, computed } = this.parsePropertyKey();
    const optional = this.ts && this.eatPunct("?");
    const definite = this.ts && this.eatPunct("!");
    Object.assign(node, {
      key,
      computed,
      static: flags.static,
      abstract: Boolean(flags.abstract),
      override: Boolean(flags.override),
      readonly: Boolean(flags.readonly),
      declare: Boolean(flags.declare),
      accessor: Boolean(flags.accessor),
      accessibility: ["public", "private", "protected"].find((name) => flags[name]) ?? null,
      optional,
    });
    if (this.isPunct("(") || (this.ts && this.isPunct("<"))) {
      const isConstructor = !computed && !flags.static && key.type === "Identifier" && key.name === "constructor";
      node.kind = flags.kind === "method" && isConstructor ? "constructor" : flags.kind;
      node.value = this.parseMethodFunction(flags.async, isGenerator);
      if (!node.value.body) {
        this.consumeSemicolon();
        node.value.end = this.prevEnd;
      }
      return this.finish(node, "MethodDefinition");
    }
    node.definite = definite;
    node.typeAnnotation = this.ts && this.isPunct(":") ? this.parseTypeAnnotation() : null;
    node.value = this.eatPunct("=")
      ? this.withFlags({ inAsync: false, inGenerator: false }, () => this.parseAssign())
      : null;
    this.consumeSemicolon();
    return this.finish(node, "PropertyDefinition");
  }

  // ----- TypeScript statements -----

  parseTypeScriptStatement(word) {
    const after = this.peekToken();
    switch (word) {
      case "interface":
        return after.type === "name" && !after.nl ? this.parseInterface() : null;
      case "type":
        return after.type === "name" && !after.nl ? this.parseTypeAlias() : null;
      case "declare": {
        if (after.type !== "name" || after.nl) {
          return null;
        }
        const node = this.startNode();
        this.next();
        const declaration = this.parseStatement();
        declaration.declare = true;
        declaration.start = node.start;
        return declaration;
      }
      case "abstract": {
        if (after.value !== "class" || after.nl) {
          return null;
        }
        const node = this.startNode();
        this.next();
        const declaration = this.parseClass({ declaration: true, idOptional: true });
        declaration.abstract = true;
        declaration.start = node.start;
        return declaration;
      }
      case "namespace":
      case "module":
        return (after.type === "name" || after.type === "string") && !after.nl ? this.parseModuleDeclaration(word) : null;
      case "global":
        return after.type === "punct" && after.value === "{" ? this.parseModuleDeclaration("global") : null;
      default:
        return null;
    }
  }

  parseInterface() {
    const node = this.startNode();
    this.next();
    node.id = this.parseIdentifier();
    node.typeParameters = this.isPunct("<") ? this.parseTypeParameters() : null;
    node.extends = [];
    if (this.eatWord("extends")) {
      do {
        node.extends.push(this.parseTypeReference());
      } while (this.eatPunct(","));
    }
    this.parseTypeMembers(node);
    return this.finish(node, "TSInterfaceDeclaration");
  }

  parseTypeAlias() {
    const node = this.startNode();
    this.next();
    node.id = this.parseIdentifier();
    node.typeParameters = this.isPunct("<") ? this.parseTypeParameters() : null;
    this.expectPunct("=");
    node.typeAnnotation = this.parseType();
    this.consumeSemicolon();
    return this.finish(node, "TSTypeAliasDeclaration");
  }

  parseEnum({ isConst = false }) {
    const node = this.startNode();
    if (isConst) {
      this.next();
    }
    this.expectWord("enum");
    node.const = isConst;
    node.id = this.parseIdentifier();
    this.expectPunct("{");
    const { items, dangling } = this.parseCommaList("}", () => {
      const member = this.startNode();
      member.id = this.tok.type === "string" ? this.parseLiteral() : this.parseIdentifier({ allowReserved: true });
      member.initializer = this.eatPunct("=") ? this.parseAssign() : null;
      return this.finish(member, "TSEnumMember");
    });
    this.expectPunct("}");
    node.members = items;
    this.setDangling(node, dangling);
    return this.finish(node, "TSEnumDeclaration");
  }

  parseModuleDeclaration(kind) {
    const node = this.startNode();
    this.next();
    node.kind = kind;
    if (kind === "global") {
      node.id = this.finish({ type: "", start: node.start, end: 0, name: "global" }, "Identifier");
    } else if (this.tok.type === "string") {
      node.id = this.parseLiteral();
    } else {
      node.id = this.parseEntityName();
    }
    node.body = null;
    if (this.isPunct("{")) {
      const block = this.parseBlock();
      node.body = block.body;
      if (block.danglingComments) {
        node.danglingComments = block.danglingComments;
      }
    } else {
      this.consumeSemicolon();
    }
    return this.finish(node, "TSModuleDeclaration");
  }

  // ----- TypeScript types -----

  parseTypeAnnotation({ returnType = false } = {}) {
    this.expectPunct(":");
    return returnType ? this.parseReturnType() : this.parseType();
  }

  parseReturnType() {
    const start = this.startNode();
    if (this.isWord("asserts")) {
      const after = this.peekToken();
      if (after.type === "name" && !after.nl) {
        this.next();
        const node = start;
        node.asserts = true;
        node.parameterName = this.parseTypePredicateName();
        node.typeAnnotation = this.eatWord("is") ? this.parseType() : null;
        return this.finish(node, "TSTypePredicate");
      }
    }
    if (this.tok.type === "name") {
      const after = this.peekToken();
      if (after.type === "name" && after.value === "is" && !after.nl) {
        const node = start;
        node.asserts = false;
        node.parameterName = this.parseTypePredicateName();
        this.expectWord("is");
        node.typeAnnotation = this.parseType();
        return this.finish(node, "TSTypePredicate");
      }
    }
    return this.parseType();
  }

  parseTypePredicateName() {
    return this.parseIdentifier({ allowReserved: true });
  }

  parseType() {
    if (this.isPunct("<") || this.isPunct("(")) {
      const functionType = this.tryParse(() => this.parseFunctionType(false));
      if (functionType) {
        return functionType;
      }
    } else if (this.isWord("new") && !this.noConditionalType) {
      return this.parseFunctionType(true);
    }
    const checkType = this.parseUnionType();
    if (!this.isWord("extends") || this.tok.nl || this.noConditionalType) {
      return checkType;
    }
    const node = this.startNodeAt(checkType);
    this.next();
    node.checkType = checkType;
    node.extendsType = this.withFlags({ noConditionalType: true }, () => this.parseType());
    this.expectPunct("?");
    node.trueType = this.parseType();
    this.expectPunct(":");
    node.falseType = this.parseType();
    return this.finish(node, "TSConditionalType");
  }

  parseFunctionType(isConstructor) {
    const node = this.startNode();
    if (isConstructor) {
      this.next();
    }
    node.constructor = isConstructor;
    node.typeParameters = this.isPunct("<") ? this.parseTypeParameters() : null;
    this.parseParams(node);
    if (!this.isPunct("=>")) {
      return null;
    }
    this.next();
    node.returnType = this.parseReturnType();
    return this.finish(node, "TSFunctionType");
  }

  parseUnionType() {
    const start = this.startNode();
    this.eatPunct("|");
    const first = this.parseIntersectionType();
    if (!this.isPunct("|")) {
      return first;
    }
    start.types = [first];
    while (this.eatPunct("|")) {
      start.types.push(this.parseIntersectionType());
    }
    return this.finish(start, "TSUnionType");
  }

  parseIntersectionType() {
    const start = this.startNode();
    this.eatPunct("&");
    const first = this.parseTypeOperator();
    if (!this.isPunct("&")) {
      return first;
    }
    start.types = [first];
    while (this.eatPunct("&")) {
      start.types.push(this.parseTypeOperator());
    }
    return this.finish(start, "TSIntersectionType");
  }

  parseTypeOperator() {
    if (this.tok.type === "name") {
      const word = this.tok.value;
      if (word === "keyof" || word === "unique" || word === "readonly") {
        const after = this.peekToken();
        const startsType = after.type === "name" || after.type === "string" || after.type === "num" ||
          (after.type === "punct" && ["(", "[", "{", "<"].includes(after.value)) || after.type === "template";
        if (startsType) {
          const node = this.startNode();
          this.next();
          node.operator = word;
          node.typeAnnotation = this.parseTypeOperator();
          return this.finish(node, "TSTypeOperator");
        }
      }
      if (word === "infer") {
        const node = this.startNode();
        this.next();
        const parameter = this.startNode();
        parameter.name = this.parseIdentifier().name;
        parameter.constraint = null;
        if (this.isWord("extends")) {
          const constraint = this.tryParse(() => {
            this.next();
            const parsed = this.withFlags({ noConditionalType: true }, () => this.parseUnionType());
            return this.isPunct("?") ? null : parsed;
          });
          parameter.constraint = constraint;
        }
        parameter.default = null;
        node.typeParameter = this.finish(parameter, "TSTypeParameter");
        return this.finish(node, "TSInferType");
      }
    }
    return this.parsePostfixType();
  }

  parsePostfixType() {
    let type = this.parsePrimaryType();
    while (this.isPunct("[") && !this.tok.nl) {
      const node = this.startNodeAt(type);
      this.next();
      if (this.eatPunct("]")) {
        node.elementType = type;
        type = this.finish(node, "TSArrayType");
      } else {
        node.objectType = type;
        node.indexType = this.parseType();
        this.expectPunct("]");
        type = this.finish(node, "TSIndexedAccessType");
      }
    }
    return type;
  }

  parsePrimaryType() {
    const token = this.tok;
    const node = this.startNode();
    if (token.type === "punct") {
      switch (token.value) {
        case "(":
          this.next();
          node.typeAnnotation = this.withFlags({ noConditionalType: false }, () => this.parseType());
          this.expectPunct(")");
          return this.finish(node, "TSParenthesizedType");
        case "[":
          return this.parseTupleType();
        case "{":
          return this.tryParse(() => this.parseMappedType()) ?? this.parseTypeLiteral();
        case "-":
          node.literal = this.parseUnary();
          return this.finish(node, "TSLiteralType");
        default:
          return this.unexpected("a type");
      }
    }
    if (token.type === "string" || token.type === "num") {
      node.literal = this.parseLiteral();
      return this.finish(node, "TSLiteralType");
    }
    if (token.type === "template") {
      node.literal = this.parseTemplate(() => this.parseType());
      return this.finish(node, "TSLiteralType");
    }
    if (token.type !== "name") {
      return this.unexpected("a type");
    }
    const word = token.value;
    if (word === "true" || word === "false" || word === "null" || word === "undefined" || word === "void") {
      node.name = word;
      this.next();
      return this.finish(node, "TSKeyword");
    }
    if (word === "this") {
      this.next();
      return this.finish(node, "TSThisType");
    }
    if (word === "typeof") {
      this.next();
      node.exprName = this.isWord("import") ? this.parseImportType() : this.parseEntityName();
      node.typeArguments = this.isPunct("<") && !this.tok.nl ? this.parseTypeArguments() : null;
      return this.finish(node, "TSTypeQuery");
    }
    if (word === "import") {
      return this.parseImportType();
    }
    if (KEYWORD_TYPES.has(word) && this.peekToken().value !== ".") {
      node.name = word;
      this.next();
      return this.finish(node, "TSKeyword");
    }
    return this.parseTypeReference();
  }

  parseImportType() {
    const node = this.startNode();
    this.expectWord("import");
    this.expectPunct("(");
    node.argument = this.parseType();
    this.expectPunct(")");
    node.qualifier = this.eatPunct(".") ? this.parseEntityName() : null;
    node.typeArguments = this.isPunct("<") ? this.parseTypeArguments() : null;
    return this.finish(node, "TSImportType");
  }

  parseEntityName() {
    let name = this.parseIdentifier({ allowReserved: true });
    while (this.isPunct(".")) {
      const node = this.startNodeAt(name);
      this.next();
      node.left = name;
      node.right = this.parseIdentifier({ allowReserved: true });
      name = this.finish(node, "TSQualifiedName");
    }
    return name;
  }

  parseTypeReference() {
    const node = this.startNode();
    node.typeName = this.parseEntityName();
    node.typeArguments = this.isPunct("<") && !this.tok.nl ? this.parseTypeArguments() : null;
    return this.finish(node, "TSTypeReference");
  }

  parseTypeArguments() {
    this.expectPunct("<");
    const types = [];
    do {
      if (this.isPunct(">")) {
        break;
      }
      types.push(this.withFlags({ noConditionalType: false }, () => this.parseType()));
    } while (this.eatPunct(","));
    this.expectTypeClose();
    return types;
  }

  parseTypeParameters() {
    this.expectPunct("<");
    const parameters = [];
    do {
      if (this.isPunct(">")) {
        break;
      }
      const node = this.startNode();
      node.modifiers = [];
      while (this.tok.type === "name" && /^(const|in|out)$/.test(this.tok.value) && this.peekToken().type === "name") {
        node.modifiers.push(this.tok.value);
        this.next();
      }
      node.name = this.parseIdentifier().name;
      node.constraint = this.eatWord("extends") ? this.parseType() : null;
      node.default = this.eatPunct("=") ? this.parseType() : null;
      parameters.push(this.finish(node, "TSTypeParameter"));
    } while (this.eatPunct(","));
    this.expectTypeClose();
    return parameters;
  }

  parseTupleType() {
    const node = this.startNode();
    this.expectPunct("[");
    const { items, dangling } = this.parseCommaList("]", () => {
      const element = this.startNode();
      const isRest = this.eatPunct("...");
      const named = this.tryParse(() => {
        const label = this.parseIdentifier({ allowReserved: true });
        const optional = this.eatPunct("?");
        return this.eatPunct(":") ? { label, optional } : null;
      });
      let inner;
      if (named) {
        inner = this.startNodeAt(element);
        inner.label = named.label;
        inner.optional = named.optional;
        inner.elementType = this.parseType();
        this.finish(inner, "TSNamedTupleMember");
      } else {
        inner = this.parseType();
        if (this.isPunct("?")) {
          const optional = this.startNodeAt(inner);
          this.next();
          optional.typeAnnotation = inner;
          inner = this.finish(optional, "TSOptionalType");
        }
      }
      if (!isRest) {
        return inner;
      }
      element.typeAnnotation = inner;
      return this.finish(element, "TSRestType");
    });
    this.expectPunct("]");
    node.elementTypes = items;
    this.setDangling(node, dangling);
    return this.finish(node, "TSTupleType");
  }

  parseTypeLiteral() {
    const node = this.startNode();
    this.parseTypeMembers(node);
    return this.finish(node, "TSTypeLiteral");
  }

  parseTypeMembers(node) {
    this.expectPunct("{");
    const { items, dangling } = this.parseItems(
      () => this.isPunct("}"),
      () => this.parseTypeMember(),
      () => {
        if (!this.eatPunct(";") && !this.eatPunct(",") && !this.isPunct("}") && !this.tok.nl) {
          this.unexpected('";" or "}"');
        }
      },
    );
    this.expectPunct("}");
    node.members = items;
    this.setDangling(node, dangling);
  }

  parseMappedType() {
    const node = this.startNode();
    this.expectPunct("{");
    node.readonly = null;
    if (this.isPunct("+") || this.isPunct("-")) {
      node.readonly = this.tok.value;
      this.next();
      this.expectWord("readonly");
    } else if (this.eatWord("readonly")) {
      node.readonly = true;
    }
    this.expectPunct("[");
    const parameter = this.startNode();
    parameter.name = this.parseIdentifier().name;
    this.expectWord("in");
    parameter.constraint = this.parseType();
    parameter.default = null;
    node.typeParameter = this.finish(parameter, "TSTypeParameter");
    node.nameType = this.eatWord("as") ? this.parseType() : null;
    this.expectPunct("]");
    node.optional = null;
    if (this.isPunct("+") || this.isPunct("-")) {
      node.optional = this.tok.value;
      this.next();
      this.expectPunct("?");
    } else if (this.eatPunct("?")) {
      node.optional = true;
    }
    node.typeAnnotation = this.eatPunct(":") ? this.parseType() : null;
    this.eatPunct(";") || this.eatPunct(",");
    this.expectPunct("}");
    return this.finish(node, "TSMappedType");
  }

  parseTypeMember() {
    const node = this.startNode();
    if (this.isPunct("(") || this.isPunct("<")) {
      this.parseSignatureRest(node);
      return this.finish(node, "TSCallSignature");
    }
    if (this.isWord("new")) {
      const after = this.peekToken();
      if (after.type === "punct" && (after.value === "(" || after.value === "<")) {
        this.next();
        this.parseSignatureRest(node);
        return this.finish(node, "TSConstructSignature");
      }
    }
    node.readonly = false;
    node.kind = "property";
    if (this.isWord("readonly")) {
      const after = this.peekToken();
      if (this.startsMemberKey(after, { allowStar: false })) {
        this.next();
        node.readonly = true;
      }
    }
    if ((this.isWord("get") || this.isWord("set")) && this.startsMemberKey(this.peekToken(), { allowStar: false })) {
      node.kind = this.tok.value;
      this.next();
    }
    if (this.tryParseIndexSignature(node)) {
      return this.finish(node, "TSIndexSignature");
    }
    const { key, computed } = this.parsePropertyKey();
    node.key = key;
    node.computed = computed;
    node.optional = this.eatPunct("?");
    if (this.isPunct("(") || this.isPunct("<")) {
      this.parseSignatureRest(node);
      return this.finish(node, "TSMethodSignature");
    }
    node.typeAnnotation = this.isPunct(":") ? this.parseTypeAnnotation() : null;
    return this.finish(node, "TSPropertySignature");
  }

  tryParseIndexSignature(node) {
    if (!this.isPunct("[")) {
      return false;
    }
    const parameter = this.tryParse(() => {
      this.next();
      const identifier = this.parseIdentifier({ allowReserved: true });
      if (!this.isPunct(":")) {
        return null;
      }
      identifier.typeAnnotation = this.parseTypeAnnotation();
      this.expectPunct("]");
      return identifier;
    });
    if (!parameter) {
      return false;
    }
    node.parameters = [parameter];
    node.typeAnnotation = this.isPunct(":") ? this.parseTypeAnnotation() : null;
    return true;
  }

  parseSignatureRest(node) {
    node.typeParameters = this.isPunct("<") ? this.parseTypeParameters() : null;
    this.parseParams(node);
    node.returnType = this.isPunct(":") ? this.parseTypeAnnotation({ returnType: true }) : null;
  }
}

// ---------------------------------------------------------------------------
// Public: parse
// ---------------------------------------------------------------------------

export function parse(source, { typescript = false } = {}) {
  const parser = new Parser(source, typescript);
  try {
    return { ast: parser.parseProgram() };
  } catch (error) {
    if (!(error instanceof SyntaxFailure)) {
      throw error;
    }
    const { line, column } = makeLocator(source)(error.offset);
    return { ast: null, error: { message: error.message, line, column } };
  }
}

// ---------------------------------------------------------------------------
// Printer
// ---------------------------------------------------------------------------

const PRECEDENCE = {
  sequence: 0,
  assignment: 1,
  conditional: 2,
  binaryOffset: 2,
  unary: 15,
  postfix: 16,
  call: 17,
  primary: 18,
};

const binaryPrecedence = (operator) => BINARY_PRECEDENCE[operator] + PRECEDENCE.binaryOffset;

const hasComments = (items) =>
  items.some((item) => item?.leadingComments?.length || item?.trailingComments?.length);

const isMultiline = (text) => text.includes("\n");

const blockLikeStatementTypes = new Set([
  "FunctionDeclaration",
  "ClassDeclaration",
  "TSInterfaceDeclaration",
  "TSEnumDeclaration",
  "TSModuleDeclaration",
]);

function isBlockLikeStatement(node) {
  const declaration = node.type.startsWith("Export") ? node.declaration : node;
  if (!declaration || !blockLikeStatementTypes.has(declaration.type)) {
    return false;
  }
  return declaration.type !== "FunctionDeclaration" || Boolean(declaration.body);
}

function needsMultiline(node) {
  if (node.leadingComments || node.trailingComments || node.danglingComments) {
    return true;
  }
  if (node.type === "BlockStatement" && node.body.length) {
    return true;
  }
  // Non-empty objects/arrays in `${...}` must expand (e.g. style=${{ ... }}).
  if (
    (node.type === "ObjectExpression" || node.type === "ObjectPattern") &&
    node.properties.length > 0
  ) {
    return true;
  }
  if (
    (node.type === "ArrayExpression" || node.type === "ArrayPattern") &&
    node.elements.length > 0
  ) {
    return true;
  }
  let found = false;
  forEachChild(node, (child) => {
    found ||= needsMultiline(child);
  });
  return found;
}

/** Flatten a same-operator `&&` / `||` chain into ordered operands. */
function flattenLogical(node) {
  const operands = [];
  const walk = (part) => {
    if (part.type === "LogicalExpression" && part.operator === node.operator) {
      walk(part.left);
      walk(part.right);
    } else {
      operands.push(part);
    }
  };
  walk(node);
  return {
    operator: node.operator,
    operands,
  };
}

/** Indent of the last line of a template quasi, so `${{ ... }}` aligns with the attribute. */
function indentFromQuasi(raw, fallback) {
  const newline = raw.lastIndexOf("\n");
  if (newline === -1) {
    return fallback;
  }
  const line = raw.slice(newline + 1);
  const match = /^( *)/.exec(line);
  return match ? match[1] : fallback;
}

/** Leading indent of the last start tag in a quasi (for breaking `>` / `/>` / children). */
function tagIndentFromQuasi(raw, fallback) {
  const matches = [...raw.matchAll(/^( *)<[A-Za-z]/gm)];
  if (matches.length === 0) {
    return indentFromQuasi(raw, fallback);
  }
  return matches[matches.length - 1][1];
}

/**
 * If the last line is `<tag ... attr=`, break so the tag name is alone and the
 * attribute sits on the next line (html template layout).
 */
function breakTagBeforeAttribute(quasi) {
  const newline = quasi.lastIndexOf("\n");
  const prefix = newline === -1 ? "" : quasi.slice(0, newline + 1);
  const line = newline === -1 ? quasi : quasi.slice(newline + 1);
  // `<tag attr=` or `<tag other="…" attr=` on one line → break before attr.
  const match = /^( *)(<[A-Za-z][\w.-]*)\s+(?:(.*)\s)?([\w.:-]+=)$/.exec(line);
  if (!match) {
    return quasi;
  }
  const [, indent, tag, , attr] = match;
  return `${prefix}${indent}${tag}\n${indent}${INDENT}${attr}`;
}

/**
 * After a multiline attribute expression, put `>` / `/>` on their own line and
 * indent following children / closing tags. Whitespace-only bodies become `/>`.
 */
function breakAfterMultilineAttribute(quasi, tagIndent) {
  const trimmedStart = quasi.replace(/^\s+/, "");
  if (trimmedStart.startsWith("/>") || trimmedStart.startsWith("/ >")) {
    const rest = trimmedStart.replace(/^\/\s*>/, "");
    return `\n${tagIndent}/>${rest}`;
  }
  if (!trimmedStart.startsWith(">")) {
    return quasi;
  }
  let rest = trimmedStart.slice(1);
  // `></span>` or `>\n  \n</span>` with no real children → self-close.
  const closeAt = rest.search(/<\//);
  if (closeAt !== -1) {
    const child = rest.slice(0, closeAt);
    const close = rest.slice(closeAt);
    if (child.trim().length === 0) {
      const afterClose = close.replace(/^<\/[A-Za-z][\w.-]*>/, "");
      return `\n${tagIndent}/>${afterClose}`;
    }
    return `\n${tagIndent}>\n${tagIndent}${INDENT}${child.trim()}\n${tagIndent}${close}`;
  }
  // Bare `>` — next template expression is the child.
  if (rest.length === 0) {
    return `\n${tagIndent}>\n${tagIndent}${INDENT}`;
  }
  // `>\n...` already broken; keep structure but normalize the `>` line.
  if (rest.startsWith("\n")) {
    return `\n${tagIndent}>${rest}`;
  }
  return `\n${tagIndent}>\n${tagIndent}${INDENT}${rest}`;
}

/** Ensure a closing tag after a multiline-attribute child starts on its own line. */
function breakClosingAfterChild(quasi, tagIndent) {
  const trimmedStart = quasi.replace(/^\s+/, "");
  if (!trimmedStart.startsWith("</")) {
    return quasi;
  }
  return `\n${tagIndent}${trimmedStart}`;
}

/** Start a multiline html`…` on its own indented line. */
function openHtmlTemplate(quasi, base) {
  if (quasi.length === 0) {
    return quasi;
  }
  const body = quasi.replace(/^\s*\n?/, "").replace(/^[ \t]+/, "");
  if (!body.startsWith("<")) {
    return `\n${base}${body}`;
  }
  const lines = body.split("\n");
  const first = lines[0].replace(/^[ \t]+/, "");
  const rest = lines.slice(1).map((line) => {
    if (!line.trim()) {
      return "";
    }
    const stripped = line.replace(/^[ \t]+/, "");
    if (/^<\/?[A-Za-z]/.test(stripped) || stripped === ">" || stripped.startsWith("/>")) {
      return `${base}${stripped}`;
    }
    return `${base}${INDENT}${stripped}`;
  });
  return `\n${base}${first}${rest.length ? `\n${rest.join("\n")}` : ""}`;
}

/** End a multiline html`…` with a newline at the statement indent before the tick. */
function closeHtmlTemplate(quasi, indent) {
  return `${quasi.replace(/\s+$/, "")}\n${indent}`;
}

function htmlTemplateNeedsLayout(quasis, expressions) {
  return (
    expressions.some((expression) => needsMultiline(expression)) ||
    quasis.some((quasi) => quasi.includes("\n")) ||
    quasis.some((quasi) => />\s*<\/[A-Za-z]/.test(quasi))
  );
}

function rewriteHtmlQuasis(quasis, expressions, indent) {
  const base = indent + INDENT;
  const next = quasis.slice();
  const layout = htmlTemplateNeedsLayout(next, expressions);
  if (layout && next[0] !== undefined) {
    next[0] = openHtmlTemplate(next[0], base);
  }
  for (let index = 0; index < expressions.length; index++) {
    if (!needsMultiline(expressions[index])) {
      continue;
    }
    next[index] = breakTagBeforeAttribute(next[index]);
    const tagIndent = tagIndentFromQuasi(next[index], base);
    next[index + 1] = breakAfterMultilineAttribute(next[index + 1], tagIndent);
    if (
      index + 2 < next.length &&
      /^\n? *$/.test(next[index + 1].split("\n").pop() ?? "") &&
      expressions[index + 1] &&
      !needsMultiline(expressions[index + 1])
    ) {
      next[index + 2] = breakClosingAfterChild(next[index + 2], tagIndent);
    }
  }
  if (layout) {
    next[next.length - 1] = closeHtmlTemplate(next[next.length - 1], indent);
  }
  return next;
}

function quoteString(raw) {
  if (raw[0] === '"') {
    return raw;
  }
  const inner = raw.slice(1, -1);
  let quoted = "";
  for (let index = 0; index < inner.length; index++) {
    const character = inner[index];
    if (character === "\\") {
      const escaped = inner[++index];
      quoted += escaped === "'" ? "'" : character + escaped;
    } else {
      quoted += character === '"' ? '\\"' : character;
    }
  }
  return `"${quoted}"`;
}

class Printer {
  constructor() {
    this.flat = 0;
    this.protectIn = false;
  }

  // ----- lists and comments -----

  comment(comment, indent) {
    if (comment.type === "Line") {
      return comment.raw.trimEnd();
    }
    const lines = comment.raw.split(/\r?\n/);
    return lines
      .map((line, index) => {
        if (index === 0) {
          return line;
        }
        const trimmed = line.trim();
        return trimmed.startsWith("*") ? `${indent} ${trimmed}` : line.trimEnd();
      })
      .join("\n");
  }

  // Every item starts on its own line at `indent`; `separator` follows the item text.
  listBody(items, indent, render, { separator = "", blankBetween, dangling = [] } = {}) {
    const texts = items.map((item, index) => render(item, index));
    const chunks = [];
    items.forEach((item, index) => {
      const comments = item.leadingComments ?? [];
      const groupBlank = comments.length ? comments[0].blankBefore : Boolean(item.blankBefore);
      const blank =
        index > 0 && (groupBlank || blankBetween?.(items[index - 1], item, texts[index - 1], texts[index]));
      let chunk = "";
      comments.forEach((comment, commentIndex) => {
        chunk += `${commentIndex > 0 && comment.blankBefore ? "\n" : ""}${indent}${this.comment(comment, indent)}\n`;
      });
      if (comments.length && item.blankBefore) {
        chunk += "\n";
      }
      const itemSeparator = typeof separator === "function" ? separator(item) : separator;
      const trailing = (item.trailingComments ?? []).map((comment) => ` ${this.comment(comment, indent)}`).join("");
      chunk += `${indent}${texts[index]}${itemSeparator}${trailing}`;
      chunks.push((blank ? "\n" : "") + chunk);
    });
    if (dangling.length) {
      const text = dangling
        .map((comment, index) => `${index > 0 && comment.blankBefore ? "\n" : ""}${indent}${this.comment(comment, indent)}`)
        .join("\n");
      chunks.push((items.length && dangling[0].blankBefore ? "\n" : "") + text);
    }
    return chunks.join("\n");
  }

  // `open`/`close` wrap an expanded list; empty lists collapse unless comments remain.
  expandedList(open, close, items, indent, render, options = {}) {
    const dangling = options.dangling ?? [];
    if (!items.length && !dangling.length) {
      return open + close;
    }
    if (this.flat) {
      const inline = items.map((item) => render(item, indent)).join(", ");
      return open === "{" ? `{ ${inline} }` : open + inline + close;
    }
    const inner = indent + INDENT;
    const body = this.listBody(items, inner, (item) => render(item, inner), {
      separator: options.separator ?? ",",
      dangling,
      blankBetween: options.blankBetween,
    });
    return `${open}\n${body}\n${indent}${close}`;
  }

  withoutTrailingCommaAfterRest(item) {
    return item?.type === "RestElement" ? "" : ",";
  }

  // ----- statements -----

  program(node) {
    const body = this.statements(node.body, "", node.danglingComments);
    return body ? `${body}\n` : "";
  }

  statements(list, indent, dangling) {
    return this.listBody(list, indent, (statement) => this.statement(statement, indent), {
      dangling,
      blankBetween: (previous, next) =>
        (previous.type === "ImportDeclaration" && next.type !== "ImportDeclaration") ||
        isBlockLikeStatement(previous) ||
        isBlockLikeStatement(next),
    });
  }

  block(node, indent) {
    return this.blockOf(node.body, indent, node.danglingComments);
  }

  blockOf(body, indent, dangling = []) {
    if (!body.length && !dangling.length) {
      return "{}";
    }
    if (this.flat) {
      return `{ ${body.map((statement) => this.statement(statement, indent)).join(" ")} }`;
    }
    return `{\n${this.statements(body, indent + INDENT, dangling)}\n${indent}}`;
  }

  clause(node, indent) {
    if (node.type === "BlockStatement") {
      return ` ${this.block(node, indent)}`;
    }
    if (node.type === "EmptyStatement") {
      return ";";
    }
    return ` ${this.statement(node, indent)}`;
  }

  statement(node, indent) {
    switch (node.type) {
      case "ExpressionStatement": {
        const text = this.expression(node.expression, indent, PRECEDENCE.sequence);
        return /^(\{|function\b|class\b|async function\b|let\s*\[)/.test(text) ? `(${text});` : `${text};`;
      }
      case "BlockStatement":
        return this.block(node, indent);
      case "EmptyStatement":
        return ";";
      case "VariableDeclaration":
        return `${this.variableDeclaration(node, indent, false)};`;
      case "FunctionDeclaration":
        return this.functionText(node, indent);
      case "ClassDeclaration":
        return this.classText(node, indent);
      case "ReturnStatement":
        return node.argument ? `return ${this.expression(node.argument, indent, PRECEDENCE.sequence)};` : "return;";
      case "ThrowStatement":
        return `throw ${this.expression(node.argument, indent, PRECEDENCE.sequence)};`;
      case "BreakStatement":
        return node.label ? `break ${node.label.name};` : "break;";
      case "ContinueStatement":
        return node.label ? `continue ${node.label.name};` : "continue;";
      case "DebuggerStatement":
        return "debugger;";
      case "LabeledStatement":
        return `${node.label.name}: ${this.statement(node.body, indent)}`;
      case "IfStatement":
        return this.ifStatement(node, indent);
      case "ForStatement": {
        const parts = [node.init, node.test, node.update].map((part) => {
          if (!part) {
            return "";
          }
          this.protectIn = part === node.init;
          const text =
            part.type === "VariableDeclaration"
              ? this.variableDeclaration(part, indent, true)
              : this.expression(part, indent, PRECEDENCE.sequence);
          this.protectIn = false;
          return text;
        });
        const header = parts.every((part) => !part) ? ";;" : parts.join("; ").trimEnd();
        return `for (${header})${this.clause(node.body, indent)}`;
      }
      case "ForInStatement":
      case "ForOfStatement": {
        const left =
          node.left.type === "VariableDeclaration"
            ? this.variableDeclaration(node.left, indent, true)
            : this.expression(node.left, indent, PRECEDENCE.call);
        const isOf = node.type === "ForOfStatement";
        const right = this.expression(node.right, indent, isOf ? PRECEDENCE.assignment : PRECEDENCE.sequence);
        return `for${node.await ? " await" : ""} (${left} ${isOf ? "of" : "in"} ${right})${this.clause(node.body, indent)}`;
      }
      case "WhileStatement":
        return `while (${this.conditionText(node.test, indent)})${this.clause(node.body, indent)}`;
      case "DoWhileStatement": {
        const separator = node.body.type === "BlockStatement" ? " " : `\n${indent}`;
        return `do${this.clause(node.body, indent)}${separator}while (${this.conditionText(node.test, indent)});`;
      }
      case "TryStatement": {
        let text = `try ${this.block(node.block, indent)}`;
        if (node.handler) {
          const param = node.handler.param ? ` (${this.expression(node.handler.param, indent, PRECEDENCE.assignment)})` : "";
          text += ` catch${param} ${this.block(node.handler.body, indent)}`;
        }
        if (node.finalizer) {
          text += ` finally ${this.block(node.finalizer, indent)}`;
        }
        return text;
      }
      case "SwitchStatement":
        return this.switchStatement(node, indent);
      case "ImportDeclaration":
        return this.importDeclaration(node, indent);
      case "ExportNamedDeclaration":
        return this.exportNamed(node, indent);
      case "ExportDefaultDeclaration": {
        const { declaration } = node;
        const isDeclaration = /^(FunctionDeclaration|ClassDeclaration|TSInterfaceDeclaration)$/.test(declaration.type);
        return isDeclaration
          ? `export default ${this.statement(declaration, indent)}`
          : `export default ${this.expression(declaration, indent, PRECEDENCE.assignment)};`;
      }
      case "ExportAllDeclaration": {
        const exported = node.exported ? ` as ${this.moduleName(node.exported)}` : "";
        return `export ${node.exportKind === "type" ? "type " : ""}*${exported} from ${this.expression(node.source, indent)};`;
      }
      default:
        return this.typeScriptStatement(node, indent);
    }
  }

  ifStatement(node, indent) {
    let text = `if (${this.conditionText(node.test, indent)})${this.clause(node.consequent, indent)}`;
    if (node.alternate) {
      text += node.consequent.type === "BlockStatement" ? " else" : `\n${indent}else`;
      text +=
        node.alternate.type === "IfStatement"
          ? ` ${this.ifStatement(node.alternate, indent)}`
          : this.clause(node.alternate, indent);
    }
    return text;
  }

  /** `if`/`while` tests: break `&&` / `||` chains with the operator at line end. */
  conditionText(node, indent) {
    if (!this.flat && node.type === "LogicalExpression") {
      const inner = indent + INDENT;
      return `\n${inner}${this.brokenLogical(node, inner)}\n${indent}`;
    }
    return this.expression(node, indent, PRECEDENCE.sequence);
  }

  brokenLogical(node, indent) {
    const chain = flattenLogical(node);
    return chain.operands
      .map((operand, index) => {
        let text;
        if (operand.type === "LogicalExpression") {
          const deeper = indent + INDENT;
          text = `(\n${deeper}${this.brokenLogical(operand, deeper)}\n${indent})`;
        } else {
          const precedence = binaryPrecedence(chain.operator);
          text = this.binaryOperand(
            operand,
            chain.operator,
            indent,
            index === 0 ? precedence : precedence + 1,
          );
        }
        return index === chain.operands.length - 1 ? text : `${text} ${chain.operator}`;
      })
      .join(`\n${indent}`);
  }

  switchStatement(node, indent) {
    const head = `switch (${this.expression(node.discriminant, indent, PRECEDENCE.sequence)})`;
    if (!node.cases.length && !node.danglingComments) {
      return `${head} {}`;
    }
    const inner = indent + INDENT;
    const body = this.listBody(node.cases, inner, (switchCase) => this.switchCase(switchCase, inner), {
      dangling: node.danglingComments,
    });
    return `${head} {\n${body}\n${indent}}`;
  }

  switchCase(node, indent) {
    const head = node.test ? `case ${this.expression(node.test, indent, PRECEDENCE.sequence)}:` : "default:";
    const { consequent } = node;
    if (!consequent.length && !node.danglingComments) {
      return head;
    }
    if (consequent.length === 1 && consequent[0].type === "BlockStatement" && !hasComments(consequent)) {
      return `${head} ${this.block(consequent[0], indent)}`;
    }
    return `${head}\n${this.statements(consequent, indent + INDENT, node.danglingComments)}`;
  }

  variableDeclaration(node, indent, inline) {
    const isStacked = node.declarations.length > 1 && !inline && !this.flat;
    const base = isStacked ? indent + INDENT : indent;
    const declarators = node.declarations.map((declarator) => {
      let text = this.expression(declarator.id, base, PRECEDENCE.assignment);
      if (declarator.definite) {
        text = text.replace(/(:|$)/, "!$1");
      }
      return declarator.init
        ? `${text} = ${this.expression(declarator.init, base, PRECEDENCE.assignment)}`
        : text;
    });
    const joined = declarators.join(isStacked ? `,\n${base}` : ", ");
    return `${node.declare ? "declare " : ""}${node.kind} ${joined}`;
  }

  moduleName(node) {
    return node.type === "Literal" ? quoteString(node.raw) : node.name;
  }

  importDeclaration(node, indent) {
    const kind = node.importKind === "type" ? "type " : "";
    const source = this.expression(node.source, indent);
    const attributes = node.attributes
      ? ` ${node.attributesKeyword} ${this.expression(node.attributes, indent)}`
      : "";
    if (!node.specifiers.length && !node.danglingComments) {
      return `import ${kind}${source}${attributes};`;
    }
    const clauses = [];
    const named = [];
    for (const specifier of node.specifiers) {
      if (specifier.type === "ImportDefaultSpecifier") {
        clauses.push(specifier.local.name);
      } else if (specifier.type === "ImportNamespaceSpecifier") {
        clauses.push(`* as ${specifier.local.name}`);
      } else {
        named.push(specifier);
      }
    }
    if (named.length || node.danglingComments) {
      clauses.push(
        this.expandedList("{", "}", named, indent, (specifier) => {
          const typeModifier = specifier.importKind === "type" ? "type " : "";
          const imported = this.moduleName(specifier.imported);
          const alias = specifier.local.name === specifier.imported.name ? "" : ` as ${specifier.local.name}`;
          return `${typeModifier}${imported}${alias}`;
        }, { dangling: node.danglingComments }),
      );
    }
    return `import ${kind}${clauses.join(", ")} from ${source}${attributes};`;
  }

  exportNamed(node, indent) {
    if (node.declaration) {
      return `export ${this.statement(node.declaration, indent)}`;
    }
    const specifiers = this.expandedList("{", "}", node.specifiers, indent, (specifier) => {
      const typeModifier = specifier.exportKind === "type" ? "type " : "";
      const local = this.moduleName(specifier.local);
      const exported = this.moduleName(specifier.exported);
      return `${typeModifier}${local}${local === exported ? "" : ` as ${exported}`}`;
    }, { dangling: node.danglingComments });
    const source = node.source ? ` from ${this.expression(node.source, indent)}` : "";
    return `export ${node.exportKind === "type" ? "type " : ""}${specifiers}${source};`;
  }

  // ----- functions and classes -----

  parameters(node, indent) {
    const { params } = node;
    const dangling = node.danglingComments ?? [];
    if (!params.length && !dangling.length) {
      return "()";
    }
    if (!this.flat && (hasComments(params) || dangling.length)) {
      return this.expandedList("(", ")", params, indent, (param, base) => this.expression(param, base, PRECEDENCE.assignment), {
        separator: this.withoutTrailingCommaAfterRest,
        dangling,
      });
    }
    return `(${params.map((param) => this.expression(param, indent, PRECEDENCE.assignment)).join(", ")})`;
  }

  typeParameters(list, indent) {
    if (!list?.length) {
      return "";
    }
    return `<${list.map((parameter) => this.type(parameter, indent)).join(", ")}>`;
  }

  returnTypeText(node, indent) {
    return node.returnType ? `: ${this.type(node.returnType, indent)}` : "";
  }

  functionSignature(node, indent) {
    return `${this.typeParameters(node.typeParameters, indent)}${this.parameters(node, indent)}${this.returnTypeText(node, indent)}`;
  }

  functionBodyText(node, indent) {
    return node.body ? ` ${this.block(node.body, indent)}` : ";";
  }

  functionText(node, indent) {
    const name = node.id ? ` ${node.id.name}` : "";
    const head = `${node.declare ? "declare " : ""}${node.async ? "async " : ""}function${node.generator ? "*" : ""}${name || (node.generator ? "" : " ")}`;
    const spacing = node.id ? "" : node.generator ? " " : "";
    return `${head}${spacing}${this.functionSignature(node, indent)}${this.functionBodyText(node, indent)}`;
  }

  arrowText(node, indent) {
    const head = `${node.async ? "async " : ""}${this.typeParameters(node.typeParameters, indent)}${this.parameters(node, indent)}${this.returnTypeText(node, indent)} =>`;
    if (!node.expression) {
      return `${head} ${this.block(node.body, indent)}`;
    }
    const body = this.expression(node.body, indent, PRECEDENCE.assignment);
    return body.startsWith("{") ? `${head} (${body})` : `${head} ${body}`;
  }

  methodText(node, indent) {
    const { value } = node;
    const modifiers = [
      node.declare && "declare",
      node.accessibility,
      node.static && "static",
      node.abstract && "abstract",
      node.override && "override",
      value.async && "async",
    ].filter(Boolean);
    const kindPrefix = node.kind === "get" || node.kind === "set" ? `${node.kind} ` : "";
    const star = value.generator ? "*" : "";
    const prefix = modifiers.length ? `${modifiers.join(" ")} ` : "";
    const optional = node.optional ? "?" : "";
    return `${prefix}${kindPrefix}${star}${this.propertyKey(node, indent)}${optional}${this.functionSignature(value, indent)}${this.functionBodyText(value, indent)}`;
  }

  fieldText(node, indent) {
    const modifiers = [
      node.declare && "declare",
      node.accessibility,
      node.static && "static",
      node.abstract && "abstract",
      node.override && "override",
      node.readonly && "readonly",
      node.accessor && "accessor",
    ].filter(Boolean);
    const prefix = modifiers.length ? `${modifiers.join(" ")} ` : "";
    const suffix = `${node.optional ? "?" : ""}${node.definite ? "!" : ""}`;
    const annotation = node.typeAnnotation ? `: ${this.type(node.typeAnnotation, indent)}` : "";
    const value = node.value ? ` = ${this.expression(node.value, indent, PRECEDENCE.assignment)}` : "";
    return `${prefix}${this.propertyKey(node, indent)}${suffix}${annotation}${value};`;
  }

  classMember(node, indent) {
    switch (node.type) {
      case "MethodDefinition":
        return this.methodText(node, indent);
      case "PropertyDefinition":
        return this.fieldText(node, indent);
      case "TSIndexSignature":
        return `${node.static ? "static " : ""}${this.typeMember(node, indent)};`;
      default:
        return `static ${this.blockOf(node.body, indent, node.danglingComments)}`;
    }
  }

  classText(node, indent) {
    let head = `${node.declare ? "declare " : ""}${node.abstract ? "abstract " : ""}class`;
    if (node.id) {
      head += ` ${node.id.name}`;
    }
    head += this.typeParameters(node.typeParameters, indent);
    if (node.superClass) {
      head += ` extends ${this.expression(node.superClass, indent, PRECEDENCE.call)}`;
      head += node.superTypeArguments ? `<${node.superTypeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
    }
    if (node.implements.length) {
      head += ` implements ${node.implements.map((type) => this.type(type, indent)).join(", ")}`;
    }
    if (!node.body.length && !node.danglingComments) {
      return `${head} {}`;
    }
    const inner = indent + INDENT;
    const body = this.listBody(node.body, inner, (member) => this.classMember(member, inner), {
      dangling: node.danglingComments,
      blankBetween: (previous, next, previousText, nextText) =>
        !/^(PropertyDefinition|TSIndexSignature)$/.test(previous.type) ||
        !/^(PropertyDefinition|TSIndexSignature)$/.test(next.type) ||
        isMultiline(previousText) ||
        isMultiline(nextText),
    });
    return `${head} {\n\n${body}\n${indent}}`;
  }

  // ----- expressions -----

  precedenceOf(node) {
    switch (node.type) {
      case "SequenceExpression":
        return PRECEDENCE.sequence;
      case "AssignmentExpression":
      case "ArrowFunctionExpression":
      case "YieldExpression":
        return PRECEDENCE.assignment;
      case "ConditionalExpression":
        return PRECEDENCE.conditional;
      case "BinaryExpression":
      case "LogicalExpression":
        return binaryPrecedence(node.operator);
      case "TSAsExpression":
      case "TSSatisfiesExpression":
        return binaryPrecedence("as");
      case "UnaryExpression":
      case "AwaitExpression":
        return PRECEDENCE.unary;
      case "UpdateExpression":
        return node.prefix ? PRECEDENCE.unary : PRECEDENCE.postfix;
      case "CallExpression":
      case "NewExpression":
      case "MemberExpression":
      case "TaggedTemplateExpression":
      case "TSNonNullExpression":
        return PRECEDENCE.call;
      default:
        return PRECEDENCE.primary;
    }
  }

  expression(node, indent, minimumPrecedence = PRECEDENCE.sequence) {
    const text = this.expressionText(node, indent);
    return this.precedenceOf(node) < minimumPrecedence ? `(${text})` : text;
  }

  // Parenthesizes mixed `??` with `||`/`&&`, and `&&` inside `||`, for clarity and validity.
  binaryOperand(child, parentOperator, indent, minimumPrecedence) {
    const text = this.expression(child, indent, minimumPrecedence);
    if (child.type !== "LogicalExpression" || text.startsWith("(")) {
      return text;
    }
    const mixesNullish = (parentOperator === "??") !== (child.operator === "??");
    const andInsideOr = parentOperator === "||" && child.operator === "&&";
    return mixesNullish || andInsideOr ? `(${text})` : text;
  }

  expressionText(node, indent) {
    switch (node.type) {
      case "Identifier":
        return `${node.name}${node.optional ? "?" : ""}${this.annotation(node, indent)}`;
      case "PrivateIdentifier":
        return `#${node.name}`;
      case "Literal":
        return node.kind === "string" ? quoteString(node.raw) : node.raw;
      case "ThisExpression":
        return "this";
      case "Super":
        return "super";
      case "Import":
        return "import";
      case "MetaProperty":
        return `${node.meta}.${node.property.name}`;
      case "TemplateLiteral":
        return this.templateText(node, indent);
      case "TaggedTemplateExpression": {
        const typeArguments = node.typeArguments ? `<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
        const htmlTag =
          node.tag.type === "Identifier" && node.tag.name === "html";
        return `${this.expression(node.tag, indent, PRECEDENCE.call)}${typeArguments}${this.templateText(node.quasi, indent, { html: htmlTag })}`;
      }
      case "ArrayExpression":
      case "ArrayPattern": {
        const hasRest = node.type === "ArrayPattern";
        const text = this.expandedList("[", "]", node.elements.map((element) => element ?? { type: "Hole" }), indent,
          (element, base) => (element.type === "Hole" ? "" : this.expression(element, base, PRECEDENCE.assignment)), {
            separator: hasRest ? this.withoutTrailingCommaAfterRest : ",",
            dangling: node.danglingComments,
          });
        return node.type === "ArrayPattern" ? text + this.annotation(node, indent, true) : text;
      }
      case "ObjectExpression":
      case "ObjectPattern": {
        const text = this.expandedList("{", "}", node.properties, indent, (property, base) => this.property(property, base), {
          separator: node.type === "ObjectPattern" ? this.withoutTrailingCommaAfterRest : ",",
          dangling: node.danglingComments,
        });
        return node.type === "ObjectPattern" ? text + this.annotation(node, indent, true) : text;
      }
      case "SpreadElement":
      case "RestElement":
        return `...${this.expression(node.argument, indent, PRECEDENCE.assignment)}${node.type === "RestElement" ? this.annotation(node, indent, true) : ""}`;
      case "AssignmentPattern":
        return `${this.expression(node.left, indent, PRECEDENCE.assignment)} = ${this.expression(node.right, indent, PRECEDENCE.assignment)}`;
      case "FunctionExpression":
        return this.functionText(node, indent);
      case "ArrowFunctionExpression":
        return this.arrowText(node, indent);
      case "ClassExpression":
        return this.classText(node, indent);
      case "TSParameterProperty": {
        const modifiers = [node.accessibility, node.override && "override", node.readonly && "readonly"].filter(Boolean);
        return `${modifiers.join(" ")} ${this.expression(node.parameter, indent, PRECEDENCE.assignment)}`;
      }
      case "SequenceExpression":
        return node.expressions.map((item) => this.expression(item, indent, PRECEDENCE.assignment)).join(", ");
      case "UnaryExpression": {
        const operand = this.expression(node.argument, indent, PRECEDENCE.unary);
        const isWord = /^[a-z]/.test(node.operator);
        const clashes = (node.operator === "+" || node.operator === "-") && operand.startsWith(node.operator);
        return `${node.operator}${isWord || clashes ? " " : ""}${operand}`;
      }
      case "AwaitExpression":
        return `await ${this.expression(node.argument, indent, PRECEDENCE.unary)}`;
      case "YieldExpression": {
        if (!node.argument) {
          return "yield";
        }
        return `yield${node.delegate ? "*" : ""} ${this.expression(node.argument, indent, PRECEDENCE.assignment)}`;
      }
      case "UpdateExpression": {
        const operand = this.expression(node.argument, indent, node.prefix ? PRECEDENCE.unary : PRECEDENCE.postfix);
        return node.prefix ? `${node.operator}${operand}` : `${operand}${node.operator}`;
      }
      case "BinaryExpression":
      case "LogicalExpression": {
        const precedence = binaryPrecedence(node.operator);
        const isExponent = node.operator === "**";
        let left = this.binaryOperand(node.left, node.operator, indent, isExponent ? precedence + 1 : precedence);
        if (isExponent && /^(UnaryExpression|AwaitExpression)$/.test(node.left.type) && !left.startsWith("(")) {
          left = `(${left})`;
        }
        const right = this.binaryOperand(node.right, node.operator, indent, isExponent ? precedence : precedence + 1);
        const text = `${left} ${node.operator} ${right}`;
        return this.protectIn && node.operator === "in" ? `(${text})` : text;
      }
      case "TSAsExpression":
      case "TSSatisfiesExpression": {
        const keyword = node.type === "TSAsExpression" ? "as" : "satisfies";
        return `${this.expression(node.expression, indent, binaryPrecedence("as"))} ${keyword} ${this.type(node.typeAnnotation, indent)}`;
      }
      case "TSNonNullExpression":
        return `${this.expression(node.expression, indent, PRECEDENCE.call)}!`;
      case "AssignmentExpression":
        return `${this.expression(node.left, indent, PRECEDENCE.call)} ${node.operator} ${this.expression(node.right, indent, PRECEDENCE.assignment)}`;
      case "ConditionalExpression":
        return this.conditionalText(node, indent);
      case "MemberExpression":
        return this.memberText(node, indent);
      case "CallExpression": {
        let callee = this.expression(node.callee, indent, PRECEDENCE.call);
        if (node.callee.type === "FunctionExpression" && !callee.startsWith("(")) {
          callee = `(${callee})`;
        }
        const typeArguments = node.typeArguments ? `<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
        return `${callee}${node.optional ? "?." : ""}${typeArguments}${this.callArguments(node, indent)}`;
      }
      case "NewExpression": {
        let callee = this.expression(node.callee, indent, PRECEDENCE.call);
        let chain = node.callee;
        while (chain.type === "MemberExpression") {
          chain = chain.object;
        }
        if (chain.type === "CallExpression" && !callee.startsWith("(")) {
          callee = `(${callee})`;
        }
        const typeArguments = node.typeArguments ? `<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
        return `new ${callee}${typeArguments}${this.callArguments(node, indent)}`;
      }
      default:
        return this.type(node, indent);
    }
  }

  annotation(node, indent, always) {
    const optional = always && node.optional ? "?" : "";
    return `${optional}${node.typeAnnotation ? `: ${this.type(node.typeAnnotation, indent)}` : ""}`;
  }

  // Template expressions stay on one line unless they need multiline (objects, etc.).
  // html`...` is pretty-printed as an HTML tree with ${} holes.
  templateText(node, indent, { html = false } = {}) {
    if (html) {
      const tree = parseHtmlTemplate(node.quasis, node.expressions);
      const savedFlat = this.flat;
      this.flat = 0;
      const body = printHtmlTemplate(tree, node.expressions, indent, {
        needsMultiline,
        printExpression: (expression, exprIndent) =>
          this.expression(expression, exprIndent, PRECEDENCE.assignment),
      });
      this.flat = savedFlat;
      return `\`${body}\``;
    }
    let text = "`";
    node.quasis.forEach((raw, index) => {
      text += raw;
      if (index < node.expressions.length) {
        const expression = node.expressions[index];
        const exprIndent = indentFromQuasi(raw, indent);
        const savedFlat = this.flat;
        this.flat = needsMultiline(expression) ? 0 : savedFlat + 1;
        text += `\${${this.expression(expression, exprIndent)}}`;
        this.flat = savedFlat;
      }
    });
    return `${text}\``;
  }

  memberText(node, indent) {
    let object = this.expression(node.object, indent, PRECEDENCE.call);
    if (node.object.type === "Literal" && node.object.kind === "number" && /^\d+$/.test(node.object.raw)) {
      object = `(${object})`;
    }
    if (node.computed) {
      const property = this.expression(node.property, indent, PRECEDENCE.sequence);
      return `${object}${node.optional ? "?." : ""}[${property}]`;
    }
    return `${object}${node.optional ? "?." : "."}${this.expressionText(node.property, indent)}`;
  }

  conditionalText(node, indent) {
    const test = this.expression(node.test, indent, binaryPrecedence("??"));
    if (this.flat) {
      return `${test} ? ${this.expression(node.consequent, indent, PRECEDENCE.assignment)} : ${this.expression(node.alternate, indent, PRECEDENCE.assignment)}`;
    }
    // Always break: `test\n  ? consequent\n  : alternate`
    const inner = indent + INDENT;
    const branchIndent = inner + INDENT;
    const consequent = this.expression(node.consequent, branchIndent, PRECEDENCE.assignment);
    const lines = [
      test,
      `${inner}? ${consequent}`,
    ];
    let tail = node.alternate;
    while (tail.type === "ConditionalExpression") {
      lines.push(`${inner}: ${this.expression(tail.test, branchIndent, binaryPrecedence("??"))}`);
      lines.push(`${inner}? ${this.expression(tail.consequent, branchIndent, PRECEDENCE.assignment)}`);
      tail = tail.alternate;
    }
    lines.push(`${inner}: ${this.expression(tail, branchIndent, PRECEDENCE.assignment)}`);
    return lines.join("\n");
  }

  callArguments(node, indent) {
    const args = node.arguments;
    const dangling = node.danglingComments ?? [];
    if (!args.length && !dangling.length) {
      return "()";
    }
    const isExpandingArgument = (argument) =>
      /^(ArrowFunctionExpression|FunctionExpression)$/.test(argument.type) ||
      (argument.type === "ObjectExpression" && argument.properties.length > 0) ||
      (argument.type === "ArrayExpression" && argument.elements.length > 0);
    const expand = args.length > 1 || args.some(isExpandingArgument) || hasComments(args) || dangling.length;
    if (this.flat || !expand) {
      return `(${args.map((argument) => this.expression(argument, indent, PRECEDENCE.assignment)).join(", ")})`;
    }
    return this.expandedList("(", ")", args, indent, (argument, base) => this.expression(argument, base, PRECEDENCE.assignment), { dangling });
  }

  propertyKey(node, indent) {
    if (node.computed) {
      return `[${this.expression(node.key, indent, PRECEDENCE.assignment)}]`;
    }
    return this.expressionText(node.key, indent);
  }

  property(node, indent) {
    switch (node.type) {
      case "SpreadElement":
      case "RestElement":
        return this.expressionText(node, indent);
      default:
        break;
    }
    const key = this.propertyKey(node, indent);
    if (node.kind === "get" || node.kind === "set") {
      return `${node.kind} ${key}${this.functionSignature(node.value, indent)}${this.functionBodyText(node.value, indent)}`;
    }
    if (node.method) {
      const { value } = node;
      return `${value.async ? "async " : ""}${value.generator ? "*" : ""}${key}${this.functionSignature(value, indent)}${this.functionBodyText(value, indent)}`;
    }
    if (node.shorthand) {
      return this.expression(node.value, indent, PRECEDENCE.assignment);
    }
    return `${key}: ${this.expression(node.value, indent, PRECEDENCE.assignment)}`;
  }

  // ----- TypeScript -----

  typeScriptStatement(node, indent) {
    switch (node.type) {
      case "TSInterfaceDeclaration": {
        const heritage = node.extends.length ? ` extends ${node.extends.map((type) => this.type(type, indent)).join(", ")}` : "";
        const declare = node.declare ? "declare " : "";
        return `${declare}interface ${node.id.name}${this.typeParameters(node.typeParameters, indent)}${heritage} ${this.typeMembers(node, indent)}`;
      }
      case "TSTypeAliasDeclaration": {
        const declare = node.declare ? "declare " : "";
        const body = this.type(node.typeAnnotation, indent, { breakUnion: true });
        const separator = body.startsWith("\n") ? "" : " ";
        return `${declare}type ${node.id.name}${this.typeParameters(node.typeParameters, indent)} =${separator}${body};`;
      }
      case "TSEnumDeclaration": {
        const head = `${node.declare ? "declare " : ""}${node.const ? "const " : ""}enum ${node.id.name}`;
        const members = this.expandedList("{", "}", node.members, indent, (member, base) => {
          const id = member.id.type === "Literal" ? quoteString(member.id.raw) : member.id.name;
          return member.initializer ? `${id} = ${this.expression(member.initializer, base, PRECEDENCE.assignment)}` : id;
        }, { dangling: node.danglingComments });
        return `${head} ${members}`;
      }
      case "TSModuleDeclaration": {
        const declare = node.declare ? "declare " : "";
        const name = node.kind === "global" ? "global" : `${node.kind} ${node.id.type === "Literal" ? quoteString(node.id.raw) : this.entityName(node.id)}`;
        if (!node.body) {
          return `${declare}${name};`;
        }
        return `${declare}${name} ${this.blockOf(node.body, indent, node.danglingComments)}`;
      }
      default:
        throw new Error(`Cannot print node type ${node.type}`);
    }
  }

  entityName(node) {
    return node.type === "TSQualifiedName" ? `${this.entityName(node.left)}.${node.right.name}` : node.name;
  }

  typeMembers(node, indent) {
    return this.expandedList("{", "}", node.members, indent, (member, base) => this.typeMember(member, base), {
      separator: ";",
      dangling: node.danglingComments,
    });
  }

  typeMember(node, indent) {
    const readonly = node.readonly ? "readonly " : "";
    switch (node.type) {
      case "TSCallSignature":
        return this.functionSignature(node, indent);
      case "TSConstructSignature":
        return `new ${this.functionSignature(node, indent)}`;
      case "TSIndexSignature": {
        const parameter = node.parameters[0];
        const annotation = node.typeAnnotation ? `: ${this.type(node.typeAnnotation, indent)}` : "";
        return `${readonly}[${parameter.name}: ${this.type(parameter.typeAnnotation, indent)}]${annotation}`;
      }
      case "TSMethodSignature": {
        const accessor = node.kind === "get" || node.kind === "set" ? `${node.kind} ` : "";
        return `${readonly}${accessor}${this.propertyKey(node, indent)}${node.optional ? "?" : ""}${this.functionSignature(node, indent)}`;
      }
      default: {
        const accessor = node.kind === "get" || node.kind === "set" ? `${node.kind} ` : "";
        const annotation = node.typeAnnotation ? this.annotationAfterColon(node.typeAnnotation, indent) : "";
        return `${readonly}${accessor}${this.propertyKey(node, indent)}${node.optional ? "?" : ""}${annotation}`;
      }
    }
  }

  annotationAfterColon(type, indent) {
    const text = this.type(type, indent, { breakUnion: true });
    return text.startsWith("\n") ? `:${text}` : `: ${text}`;
  }

  type(node, indent, { breakUnion = false } = {}) {
    switch (node.type) {
      case "TSKeyword":
        return node.name;
      case "TSThisType":
        return "this";
      case "TSTypeReference": {
        const name = this.entityName(node.typeName);
        return node.typeArguments ? `${name}<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : name;
      }
      case "TSQualifiedName":
        return this.entityName(node);
      case "TSLiteralType":
        return node.literal.type === "TemplateLiteral" ? this.templateText(node.literal, indent) : this.expression(node.literal, indent);
      case "TSArrayType":
        return `${this.type(node.elementType, indent)}[]`;
      case "TSTupleType": {
        if (!node.elementTypes.length) {
          return "[]";
        }
        return `[${node.elementTypes.map((type) => this.type(type, indent)).join(", ")}]`;
      }
      case "TSNamedTupleMember":
        return `${node.label.name}${node.optional ? "?" : ""}: ${this.type(node.elementType, indent)}`;
      case "TSOptionalType":
        return `${this.type(node.typeAnnotation, indent)}?`;
      case "TSRestType":
        return `...${this.type(node.typeAnnotation, indent)}`;
      case "TSUnionType": {
        if (breakUnion && node.types.length > 3 && !this.flat) {
          const inner = indent + INDENT;
          return `\n${node.types.map((type) => `${inner}| ${this.type(type, inner)}`).join("\n")}`;
        }
        return node.types.map((type) => this.type(type, indent)).join(" | ");
      }
      case "TSIntersectionType":
        return node.types.map((type) => this.type(type, indent)).join(" & ");
      case "TSParenthesizedType":
        return `(${this.type(node.typeAnnotation, indent)})`;
      case "TSFunctionType":
        return `${node.constructor === true ? "new " : ""}${this.typeParameters(node.typeParameters, indent)}${this.parameters(node, indent)} => ${this.type(node.returnType, indent)}`;
      case "TSTypeLiteral":
        return this.typeMembers(node, indent);
      case "TSTypeOperator":
        return `${node.operator} ${this.type(node.typeAnnotation, indent)}`;
      case "TSIndexedAccessType":
        return `${this.type(node.objectType, indent)}[${this.type(node.indexType, indent)}]`;
      case "TSConditionalType":
        return `${this.type(node.checkType, indent)} extends ${this.type(node.extendsType, indent)} ? ${this.type(node.trueType, indent)} : ${this.type(node.falseType, indent)}`;
      case "TSInferType": {
        const { typeParameter } = node;
        return `infer ${typeParameter.name}${typeParameter.constraint ? ` extends ${this.type(typeParameter.constraint, indent)}` : ""}`;
      }
      case "TSTypeQuery": {
        const name = node.exprName.type === "TSImportType" ? this.type(node.exprName, indent) : this.entityName(node.exprName);
        const typeArguments = node.typeArguments ? `<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
        return `typeof ${name}${typeArguments}`;
      }
      case "TSImportType": {
        const qualifier = node.qualifier ? `.${this.entityName(node.qualifier)}` : "";
        const typeArguments = node.typeArguments ? `<${node.typeArguments.map((type) => this.type(type, indent)).join(", ")}>` : "";
        return `import(${this.type(node.argument, indent)})${qualifier}${typeArguments}`;
      }
      case "TSTypePredicate": {
        const asserts = node.asserts ? "asserts " : "";
        const target = node.typeAnnotation ? ` is ${this.type(node.typeAnnotation, indent)}` : "";
        return `${asserts}${node.parameterName.name}${target}`;
      }
      case "TSTypeParameter": {
        const modifiers = node.modifiers?.length ? `${node.modifiers.join(" ")} ` : "";
        const constraint = node.constraint ? ` extends ${this.type(node.constraint, indent)}` : "";
        const defaultType = node.default ? ` = ${this.type(node.default, indent)}` : "";
        return `${modifiers}${node.name}${constraint}${defaultType}`;
      }
      case "TSMappedType": {
        const readonly = node.readonly === true ? "readonly " : node.readonly ? `${node.readonly}readonly ` : "";
        const optional = node.optional === true ? "?" : node.optional ? `${node.optional}?` : "";
        const { typeParameter } = node;
        const nameType = node.nameType ? ` as ${this.type(node.nameType, indent)}` : "";
        const value = node.typeAnnotation ? `: ${this.type(node.typeAnnotation, indent)}` : "";
        const inner = indent + INDENT;
        const member = `${readonly}[${typeParameter.name} in ${this.type(typeParameter.constraint, inner)}${nameType}]${optional}${value};`;
        return this.flat ? `{ ${member} }` : `{\n${inner}${member}\n${indent}}`;
      }
      default:
        throw new Error(`Cannot print node type ${node.type}`);
    }
  }
}

export function print(ast) {
  return new Printer().program(ast);
}

// ---------------------------------------------------------------------------
// Lint: scopes and rules
// ---------------------------------------------------------------------------

const ALWAYS_DEFINED = new Set(["undefined", "NaN", "Infinity"]);
const COMMENT_KEYS = new Set(["leadingComments", "trailingComments", "danglingComments"]);

function forEachChild(node, visit) {
  for (const key of Object.keys(node)) {
    if (COMMENT_KEYS.has(key)) {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && typeof item.type === "string") {
          visit(item);
        }
      }
    } else if (value && typeof value === "object" && typeof value.type === "string") {
      visit(value);
    }
  }
}

class Scope {
  constructor(parent, isFunction) {
    this.parent = parent;
    this.isFunction = isFunction;
    this.bindings = new Map();
  }
}

class ScopeAnalyzer {
  constructor() {
    this.bindings = [];
    this.references = [];
    this.findings = [];
  }

  analyze(program) {
    const scope = new Scope(null, true);
    for (const statement of program.body) {
      this.visit(statement, scope);
    }
    return this;
  }

  report(node, offset, message, rule) {
    this.findings.push({ offset: offset ?? node.start, message, rule });
  }

  declare(scope, identifier, kind, { ambient = false } = {}) {
    if (scope.bindings.has(identifier.name)) {
      return scope.bindings.get(identifier.name);
    }
    const binding = { name: identifier.name, node: identifier, kind, used: ambient, scope };
    scope.bindings.set(identifier.name, binding);
    this.bindings.push(binding);
    return binding;
  }

  functionScope(scope) {
    let current = scope;
    while (!current.isFunction) {
      current = current.parent;
    }
    return current;
  }

  reference(name, node, scope, flags = {}) {
    this.references.push({ name, node, scope, read: true, write: false, typeOnly: false, guarded: false, ...flags });
  }

  visitAll(nodes, scope) {
    for (const node of nodes) {
      if (node) {
        this.visit(node, scope);
      }
    }
  }

  visitChildren(node, scope) {
    forEachChild(node, (child) => this.visit(child, scope));
  }

  leftmostIdentifier(entity) {
    let current = entity;
    while (current.type === "TSQualifiedName") {
      current = current.left;
    }
    return current;
  }

  declarePattern(pattern, scope, kind, expressionScope = scope, options = {}) {
    switch (pattern.type) {
      case "Identifier":
        this.declare(scope, pattern, kind, options);
        break;
      case "ObjectPattern":
        for (const property of pattern.properties) {
          if (property.type === "RestElement") {
            this.declarePattern(property.argument, scope, kind, expressionScope, options);
          } else {
            if (property.computed) {
              this.visit(property.key, expressionScope);
            }
            this.declarePattern(property.value, scope, kind, expressionScope, options);
          }
        }
        break;
      case "ArrayPattern":
        for (const element of pattern.elements) {
          if (element) {
            this.declarePattern(element, scope, kind, expressionScope, options);
          }
        }
        break;
      case "AssignmentPattern":
        this.declarePattern(pattern.left, scope, kind, expressionScope, options);
        this.visit(pattern.right, expressionScope);
        return;
      case "RestElement":
        this.declarePattern(pattern.argument, scope, kind, expressionScope, options);
        break;
      case "TSParameterProperty":
        this.declarePattern(pattern.parameter, scope, kind, expressionScope, { ...options, ambient: true });
        return;
      default:
        break;
    }
    if (pattern.typeAnnotation) {
      this.visit(pattern.typeAnnotation, expressionScope);
    }
  }

  // Assignment targets: identifiers become writes, member expressions are ordinary reads.
  visitAssignmentTarget(target, scope) {
    switch (target.type) {
      case "Identifier":
        this.reference(target.name, target, scope, { read: false, write: true });
        break;
      case "ObjectPattern":
        for (const property of target.properties) {
          if (property.type === "RestElement") {
            this.visitAssignmentTarget(property.argument, scope);
          } else {
            if (property.computed) {
              this.visit(property.key, scope);
            }
            this.visitAssignmentTarget(property.value, scope);
          }
        }
        break;
      case "ArrayPattern":
        for (const element of target.elements) {
          if (element) {
            this.visitAssignmentTarget(element, scope);
          }
        }
        break;
      case "AssignmentPattern":
        this.visitAssignmentTarget(target.left, scope);
        this.visit(target.right, scope);
        break;
      case "RestElement":
        this.visitAssignmentTarget(target.argument, scope);
        break;
      default:
        this.visit(target, scope);
    }
  }

  declaredNames(declaration) {
    const names = [];
    const collect = (pattern) => {
      switch (pattern.type) {
        case "Identifier":
          names.push(pattern.name);
          break;
        case "ObjectPattern":
          pattern.properties.forEach((property) => collect(property.type === "RestElement" ? property.argument : property.value));
          break;
        case "ArrayPattern":
          pattern.elements.forEach((element) => element && collect(element));
          break;
        case "AssignmentPattern":
          collect(pattern.left);
          break;
        case "RestElement":
          collect(pattern.argument);
          break;
        default:
          break;
      }
    };
    if (declaration.type === "VariableDeclaration") {
      declaration.declarations.forEach((declarator) => collect(declarator.id));
    } else if (declaration.id) {
      names.push(declaration.id.name);
    }
    return names;
  }

  visit(node, scope) {
    switch (node.type) {
      case "Identifier":
        this.reference(node.name, node, scope);
        return;
      case "BlockStatement": {
        const inner = new Scope(scope, false);
        this.visitAll(node.body, inner);
        return;
      }
      case "VariableDeclaration": {
        const target = node.kind === "var" ? this.functionScope(scope) : scope;
        for (const declarator of node.declarations) {
          this.declarePattern(declarator.id, target, node.kind, scope, { ambient: Boolean(node.declare) });
          if (declarator.init) {
            this.visit(declarator.init, scope);
          }
        }
        return;
      }
      case "FunctionDeclaration":
        if (node.id) {
          this.declare(scope, node.id, "function", { ambient: !node.body || Boolean(node.declare) });
        }
        this.visitFunction(node, scope);
        return;
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        this.visitFunction(node, scope);
        return;
      case "ClassDeclaration":
      case "ClassExpression":
        this.visitClass(node, scope);
        return;
      case "CatchClause": {
        const inner = new Scope(scope, false);
        if (node.param) {
          this.declarePattern(node.param, inner, "catch");
        }
        this.visitAll(node.body.body, inner);
        return;
      }
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement": {
        const inner = new Scope(scope, false);
        for (const key of ["init", "left", "right", "test", "update"]) {
          const part = node[key];
          if (!part) {
            continue;
          }
          if (key === "left" && part.type !== "VariableDeclaration") {
            this.visitAssignmentTarget(part, inner);
          } else {
            this.visit(part, inner);
          }
        }
        this.visit(node.body, inner);
        return;
      }
      case "LabeledStatement":
        this.visit(node.body, scope);
        return;
      case "BreakStatement":
      case "ContinueStatement":
      case "MetaProperty":
      case "TSKeyword":
      case "TSThisType":
      case "Import":
        return;
      case "ImportDeclaration":
        for (const specifier of node.specifiers) {
          this.declare(scope, specifier.local, "import");
        }
        return;
      case "ExportNamedDeclaration":
        this.visitExportNamed(node, scope);
        return;
      case "ExportDefaultDeclaration": {
        const { declaration } = node;
        this.visit(declaration, scope);
        if (declaration.id) {
          this.markUsed(scope, declaration.id.name);
        }
        return;
      }
      case "ExportAllDeclaration":
        return;
      case "AssignmentExpression":
        if (node.operator === "=") {
          this.visitAssignmentTarget(node.left, scope);
        } else if (node.left.type === "Identifier") {
          this.reference(node.left.name, node.left, scope, { write: true });
        } else {
          this.visit(node.left, scope);
        }
        this.visit(node.right, scope);
        return;
      case "UnaryExpression":
        if (node.operator === "typeof" && node.argument.type === "Identifier") {
          this.reference(node.argument.name, node.argument, scope, { guarded: true });
          return;
        }
        this.visit(node.argument, scope);
        return;
      case "BinaryExpression":
        if (node.operator === "==" || node.operator === "!=") {
          this.reportEquality(node);
        }
        this.visitChildren(node, scope);
        return;
      case "MemberExpression":
        this.visit(node.object, scope);
        if (node.computed) {
          this.visit(node.property, scope);
        }
        return;
      case "ObjectExpression":
        this.checkDuplicateKeys(node);
        this.visitChildren(node, scope);
        return;
      case "Property":
        if (node.computed) {
          this.visit(node.key, scope);
        }
        this.visit(node.value, scope);
        return;
      case "PrivateIdentifier":
      case "Literal":
        return;
      default:
        this.visitTypeScript(node, scope);
    }
  }

  markUsed(scope, name) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(name);
      if (binding) {
        binding.used = true;
        return;
      }
    }
  }

  visitExportNamed(node, scope) {
    if (node.declaration) {
      this.visit(node.declaration, scope);
      for (const name of this.declaredNames(node.declaration)) {
        this.markUsed(scope, name);
      }
      return;
    }
    if (node.source) {
      return;
    }
    for (const specifier of node.specifiers) {
      if (specifier.local.type === "Identifier") {
        this.reference(specifier.local.name, specifier.local, scope, { typeOnly: node.exportKind === "type" || specifier.exportKind === "type" });
      }
    }
  }

  reportEquality(node) {
    // Allow `== null` / `!= null` (and undefined) as the nullish check idiom.
    if (this.isNullishLiteral(node.left) || this.isNullishLiteral(node.right)) {
      return;
    }
    const searchFrom = node.left.end;
    const offset = this.source.indexOf(node.operator, searchFrom);
    this.report(node, offset === -1 ? node.start : offset, `Expected '${node.operator}=' and instead saw '${node.operator}'.`, "eqeqeq");
  }

  isNullishLiteral(node) {
    return (
      (node.type === "Literal" && node.value === null) ||
      (node.type === "Identifier" && node.name === "undefined")
    );
  }

  checkDuplicateKeys(node) {
    const seen = new Map();
    for (const property of node.properties) {
      if (property.type !== "Property" || property.computed) {
        continue;
      }
      const { key } = property;
      const name = key.type === "Identifier" ? key.name : key.type === "Literal" ? String(key.value) : null;
      if (name === null) {
        continue;
      }
      const kinds = seen.get(name) ?? new Set();
      const duplicate = property.kind === "init" ? kinds.size > 0 : kinds.has(property.kind) || kinds.has("init");
      if (duplicate) {
        this.report(key, key.start, `Duplicate key '${name}'.`, "no-dupe-keys");
      }
      kinds.add(property.kind);
      seen.set(name, kinds);
    }
  }

  visitFunction(node, scope) {
    const inner = new Scope(scope, true);
    if (node.type === "FunctionExpression") {
      if (node.id) {
        this.declare(inner, node.id, "function-name", { ambient: true });
      }
    }
    if (node.type !== "ArrowFunctionExpression") {
      this.declare(inner, { name: "arguments" }, "implicit", { ambient: true });
    }
    this.visitTypeParameters(node.typeParameters, inner);
    const bindsParameters = Boolean(node.body);
    for (const parameter of node.params) {
      if (bindsParameters) {
        this.declarePattern(parameter, inner, "param");
      } else {
        this.visitParameterTypes(parameter, inner);
      }
    }
    if (node.returnType) {
      this.visit(node.returnType, inner);
    }
    if (!node.body) {
      return;
    }
    if (node.body.type === "BlockStatement") {
      this.visitAll(node.body.body, inner);
    } else {
      this.visit(node.body, inner);
    }
  }

  visitParameterTypes(parameter, scope) {
    if (parameter.typeAnnotation) {
      this.visit(parameter.typeAnnotation, scope);
    }
    if (parameter.type === "TSParameterProperty") {
      this.visitParameterTypes(parameter.parameter, scope);
    } else if (parameter.type === "AssignmentPattern") {
      this.visitParameterTypes(parameter.left, scope);
    } else if (parameter.type === "RestElement") {
      this.visitParameterTypes(parameter.argument, scope);
    }
  }

  visitTypeParameters(parameters, scope) {
    for (const parameter of parameters ?? []) {
      this.visit(parameter, scope);
    }
  }

  visitClass(node, scope) {
    let inner = scope;
    if (node.type === "ClassDeclaration") {
      if (node.id) {
        this.declare(scope, node.id, "class", { ambient: Boolean(node.declare) });
      }
    } else if (node.id) {
      inner = new Scope(scope, false);
      this.declare(inner, node.id, "class-name", { ambient: true });
    }
    this.visitTypeParameters(node.typeParameters, inner);
    if (node.superClass) {
      this.visit(node.superClass, inner);
    }
    this.visitAll(node.superTypeArguments ?? [], inner);
    this.visitAll(node.implements, inner);
    for (const member of node.body) {
      if (member.type === "StaticBlock") {
        this.visitAll(member.body, new Scope(inner, true));
        continue;
      }
      if (member.type === "TSIndexSignature") {
        this.visit(member, inner);
        continue;
      }
      if (member.computed) {
        this.visit(member.key, inner);
      }
      if (member.type === "MethodDefinition") {
        this.visitFunction(member.value, inner);
      } else {
        if (member.typeAnnotation) {
          this.visit(member.typeAnnotation, inner);
        }
        if (member.value) {
          this.visit(member.value, new Scope(inner, true));
        }
      }
    }
  }

  visitTypeScript(node, scope) {
    switch (node.type) {
      case "TSTypeReference": {
        const identifier = this.leftmostIdentifier(node.typeName);
        this.reference(identifier.name, identifier, scope, { typeOnly: true });
        this.visitAll(node.typeArguments ?? [], scope);
        return;
      }
      case "TSTypeQuery": {
        if (node.exprName.type !== "TSImportType") {
          const identifier = this.leftmostIdentifier(node.exprName);
          this.reference(identifier.name, identifier, scope, { typeOnly: true });
        }
        this.visitAll(node.typeArguments ?? [], scope);
        return;
      }
      case "TSInterfaceDeclaration": {
        this.declare(scope, node.id, "type", { ambient: true });
        const inner = new Scope(scope, false);
        this.visitTypeParameters(node.typeParameters, inner);
        this.visitAll(node.extends, inner);
        this.visitAll(node.members, inner);
        return;
      }
      case "TSTypeAliasDeclaration": {
        this.declare(scope, node.id, "type", { ambient: true });
        const inner = new Scope(scope, false);
        this.visitTypeParameters(node.typeParameters, inner);
        this.visit(node.typeAnnotation, inner);
        return;
      }
      case "TSEnumDeclaration":
        this.declare(scope, node.id, "enum", { ambient: true });
        for (const member of node.members) {
          if (member.initializer) {
            this.visit(member.initializer, scope);
          }
        }
        return;
      case "TSModuleDeclaration":
        if (node.id.type === "Identifier") {
          this.declare(scope, node.id, "module", { ambient: true });
        }
        if (node.body) {
          this.visitAll(node.body, new Scope(scope, false));
        }
        return;
      case "TSPropertySignature":
      case "TSMethodSignature": {
        if (node.computed) {
          this.visit(node.key, scope);
        }
        const inner = new Scope(scope, false);
        this.visitTypeParameters(node.typeParameters, inner);
        for (const parameter of node.params ?? []) {
          this.visitParameterTypes(parameter, inner);
        }
        this.visitOptional(node.returnType, inner);
        this.visitOptional(node.typeAnnotation, inner);
        return;
      }
      case "TSIndexSignature":
        this.visitParameterTypes(node.parameters[0], scope);
        this.visitOptional(node.typeAnnotation, scope);
        return;
      case "TSCallSignature":
      case "TSConstructSignature":
      case "TSFunctionType": {
        const inner = new Scope(scope, false);
        this.visitTypeParameters(node.typeParameters, inner);
        for (const parameter of node.params) {
          this.visitParameterTypes(parameter, inner);
        }
        this.visitOptional(node.returnType, inner);
        return;
      }
      case "TSTypeParameter":
        this.visitOptional(node.constraint, scope);
        this.visitOptional(node.default, scope);
        return;
      case "TSMappedType":
        this.visitOptional(node.typeParameter.constraint, scope);
        this.visitOptional(node.nameType, scope);
        this.visitOptional(node.typeAnnotation, scope);
        return;
      case "TSInferType":
        this.visitOptional(node.typeParameter.constraint, scope);
        return;
      case "TSNamedTupleMember":
        this.visit(node.elementType, scope);
        return;
      case "TSTypePredicate":
        this.visitOptional(node.typeAnnotation, scope);
        return;
      case "TSImportType":
        this.visitAll(node.typeArguments ?? [], scope);
        return;
      case "TSEnumMember":
        return;
      default:
        this.visitChildren(node, scope);
    }
  }

  visitOptional(node, scope) {
    if (node) {
      this.visit(node, scope);
    }
  }

  resolve(globals) {
    for (const reference of this.references) {
      let binding = null;
      for (let scope = reference.scope; scope && !binding; scope = scope.parent) {
        binding = scope.bindings.get(reference.name) ?? null;
      }
      if (binding) {
        if (reference.read || reference.typeOnly) {
          binding.used = true;
        }
      } else if (
        !reference.typeOnly &&
        !reference.guarded &&
        !globals.has(reference.name) &&
        !ALWAYS_DEFINED.has(reference.name)
      ) {
        this.report(reference.node, reference.node.start, `'${reference.name}' is not defined.`, "no-undef");
      }
    }
    const skippedKinds = new Set(["implicit", "function-name", "class-name", "type", "enum", "module"]);
    for (const binding of this.bindings) {
      if (binding.used || binding.name.startsWith("_") || skippedKinds.has(binding.kind)) {
        continue;
      }
      this.report(binding.node, binding.node.start, `'${binding.name}' is defined but never used.`, "no-unused-vars");
    }
  }
}

export function collectLint(ast, source, { globals = new Set() } = {}) {
  const analyzer = new ScopeAnalyzer();
  analyzer.source = source;
  analyzer.analyze(ast).resolve(globals);
  const locate = makeLocator(source);
  return analyzer.findings
    .map(({ offset, message, rule }) => ({ message, ...locate(offset), rule }))
    .sort((first, second) => first.line - second.line || first.column - second.column);
}
