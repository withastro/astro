export type HProps = Record<string, string> | null | undefined;
export type HChild = string | undefined | (() => string);
export type HMXComponent = (props: HProps, ...children: Array<HChild>) => string;
export type HTag = string | HMXComponent;

function* _h(tag: string, attrs: HProps, children: Array<HChild>) {
  yield `<${tag}`;
  if (attrs) {
    yield ' ';
    for (let [key, value] of Object.entries(attrs)) {
      yield `${key}="${value}"`;
    }
  }
  yield '>';

  for (let child of children) {
    // Special: If a child is a function, call it automatically.
    // This lets you do {() => ...} without the extra boilerplate
    // of wrapping it in a function and calling it.
    if (typeof child === 'function') {
      yield child();
    } else if (typeof child === 'string') {
      yield child;
    } else if (!child) {
      // do nothing, safe to ignore falsey values.
    } else {
      yield child;
    }
  }

  yield `</${tag}>`;
}

export async function h(tag: HTag, attrs: HProps, ...pChildren: Array<Promise<HChild>>) {
  const children = await Promise.all(pChildren.flat(Infinity));
  if (typeof tag === 'function') {
    // We assume it's an hmx component
    return tag(attrs, ...children);
  }

  return Array.from(_h(tag, attrs, children)).join('');
}

export function Fragment(_: HProps, ...children: Array<string>) {
  return children.join('');
}
