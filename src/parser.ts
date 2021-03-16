const [
  CHARS,
  TAG_START,
  TAG_END,
  END_TAG_START,
  EQ,
  EOF,
  UNKNOWN
] = Array.from(new Array(20), (x, i) => i + 1);

const voidTags = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr',
  'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

type Visitor = (tag: Tag) => Tag;

interface State {
  code: string;
  index: number;
  visitor: Visitor;
  tagName?: string;
}

interface Attribute {
  name: string;
  value?: string;
  boolean: boolean;
  start: number;
  end: number;
}

interface Text {
  type: 0;
  data: string;
  start: number;
  end: number;
}

export interface Tag {
  type: 1;
  tagName: string;
  attributes: Array<Attribute>;
  children: Array<Tag | Text>;
  void: boolean;
  start: number;
  end: number;
}

interface Document {
  children: Array<Tag | Text>;
}

function stateChar(state: State) {
  return state.code[state.index];
}

function stateNext(state: State) {
  state.index++;
  return stateChar(state);
}

function stateRewind(state: State) {
  state.index--;
  return stateChar(state);
}

function stateInBounds(state: State) {
  return state.index < state.code.length;
}

function createState(code: string, visitor: Visitor): State {
  return {
    code,
    index: 0,
    visitor
  };
}

function* _stringify(tag: Tag): Generator<string, void, unknown> {
  yield '<';
  yield tag.tagName;
  for(let attr of tag.attributes) {
    yield ' ';
    yield `"${attr.name}"`;
    if(!attr.boolean) {
      yield '=';
      yield `"${attr.value}"`;
    }
  }
  if(!tag.void) {
    for(let child of tag.children) {
      if(child.type === 0) {
        yield child.data;
      } else {
        yield * _stringify(child);
      }
    }
  }
}

function stringify(tag: Tag) {
  let out = '';
  for(let chunk of _stringify(tag)) {
    out += chunk;
  }
  return out;
}

function spliceSlice(str: string, index: number, count: number, add: string) {
  // We cannot pass negative indexes directly to the 2nd slicing operation.
  if (index < 0) {
    index = str.length + index;
    if (index < 0) {
      index = 0;
    }
  }

  return str.slice(0, index) + (add || "") + str.slice(index + count);
}

function replaceTag(state: State, tag: Tag) {
  const origLen = tag.end - tag.start;
  const html = stringify(tag);
  const newLen = html.length;
  const newCurIndex = tag.start + newLen;

  state.code = spliceSlice(state.code, tag.start, origLen, html);
  state.index = newCurIndex;
}

function consumeToken(state: State) {
  do {
    const c = stateNext(state);

    if(/\s/.test(c)) {
      continue;
    }

    if(c === '<') {
      return TAG_START;
    }

    if(c === '>') {
      return TAG_END;
    }

    if(c === '/') {
      return END_TAG_START;
    }

    if(/[a-zA-Z]/.test(c)) {
      return CHARS;
    }

    return UNKNOWN;
  } while(stateInBounds(state));

  return EOF;
}

function consumeText(state: State): Text {
  let start = state.index;
  let data = '';
  let c = stateNext(state);
  while(stateInBounds(state) && c !== '<') {
    data += c;
    c = stateNext(state);
  }

  return {
    type: 0,
    data,
    start,
    end: state.index - 1
  };
}

function consumeTagName(state: State): string {
  let name = '';
  let token = consumeToken(state);
  while(token === CHARS) {
    name += stateChar(state);
    token = consumeToken(state);
  }
  return name.toLowerCase();
}

function consumeAttribute(state: State): Attribute {
  let start = state.index;
  let name = '', token;
  do {
    name += stateChar(state).toLowerCase();
    token = consumeToken(state);
  } while(token === CHARS);

  if(token !== EQ) {
    stateRewind(state);
    return {
      name,
      boolean: true,
      start,
      end: state.index - 1
    };
  }

  let value = '';
  do {
    value += stateChar(state).toLowerCase();
    token = consumeToken(state);
  } while(token === CHARS);

  return {
    name,
    value,
    boolean: false,
    start,
    end: state.index - 1
  };
}

function consumeChildren(state: State): Array<Tag | Text> {
  const children: Array<Tag | Text> = [];

  childLoop: while(stateInBounds(state)) {
    const token = consumeToken(state);
    switch(token) {
      case TAG_START: {
        const next = consumeToken(state);
        if(next === END_TAG_START) {
          consumeTagName(state);
          consumeToken(state); // >
          break childLoop;
        } else {
          stateRewind(state);
          consumeTag(state);
        }
        break;
      }
      case CHARS: {
        children.push(consumeText(state));
        break;
      }
      default: {
        break;
      }
    }
  }

  return children;
}

function consumeTag(state: State): Tag {
  const start = state.index - 1;
  const tagName = consumeTagName(state);
  const attributes: Array<Attribute> = [];

  let token = consumeToken(state);

  // Collect attributes
  attrLoop: while(token !== TAG_END) {
    switch(token) {
      case CHARS: {
        attributes.push(consumeAttribute(state));
        break;
      }
      default: {
        break attrLoop;
      }
    }

    token = consumeToken(state);
  }

  const children: Array<Tag | Text> = consumeChildren(state);

  const node: Tag = {
    type: 1,
    tagName,
    attributes,
    children,
    void: voidTags.has(tagName),
    start,
    end: state.index - 1
  };

  const replacement = state.visitor(node);
  if(replacement !== node) {
    replaceTag(state, node);
  }

  return node;
}

function consumeDocument(state: State): Document {
  const children: Array<Tag | Text> = consumeChildren(state);

  return {
    children
  };
}

export function preparse(code: string, visitor: Visitor) {
  const state = createState(code, visitor);
  consumeDocument(state);
}