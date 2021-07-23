export type HProps = Record<string, string | boolean> | null | undefined;
export type HChild = string | undefined | (() => string);
export type AstroComponent = (props: HProps, ...children: Array<HChild>) => string;
export type HTag = string | AstroComponent;

const voidTags = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function* _children(children: Array<HChild>) {
  for (let child of children) {
    // Special: If a child is a function, call it automatically.
    // This lets you do {() => ...} without the extra boilerplate
    // of wrapping it in a function and calling it.
    if (typeof child === 'function') {
      yield child();
    } else if (typeof child === 'string') {
      yield child;
    } else if (!child && child !== 0) {
      // do nothing, safe to ignore falsey values.
    } else {
      yield child;
    }
  }
}

/** Generator for primary h() function */
function* _h(tag: string, attrs: HProps, children: Array<HChild>) {
  if (tag.toLowerCase() === '!doctype') {
    yield `<${tag} `;
    if (attrs) {
      yield Object.keys(attrs).join(' ');
    }
    yield '>';
    return;
  }

  yield `<${tag}`;
  if (attrs) {
    for (let [key, value] of Object.entries(attrs)) {
      if (value === '') yield ` ${key}=""`;
      else if (value == null || value === false) yield '';
      else if (value === true) yield ` ${key}`;
      else yield ` ${key}="${value}"`;
    }
  }
  yield '>';

  // Void tags have no children.
  if (voidTags.has(tag)) {
    return;
  }

  yield * _children(children);

  yield `</${tag}>`;
}

/** Astro‘s primary h() function. Allows it to use JSX-like syntax. */
export async function h(tag: HTag, attrs: HProps, ...pChildren: Array<Promise<HChild>>) {
  const children = await Promise.all(pChildren.flat(Infinity));
  if (typeof tag === 'function') {
    // We assume it's an astro component
    return tag(attrs, ...children);
  }

  return Array.from(_h(tag, attrs, children)).join('');
}

/** Fragment helper, similar to React.Fragment */
export function Fragment(_: HProps, ...children: Array<HChild>) {
  return Array.from(_children(children)).join('');
}
