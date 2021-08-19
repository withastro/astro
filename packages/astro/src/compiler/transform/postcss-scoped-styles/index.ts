import { Plugin } from 'postcss';

interface AstroScopedOptions {
  className: string;
}

interface Selector {
  start: number;
  end: number;
  value: string;
}

const GLOBAL = ':global('; // custom function to prevent scoping
const CSS_SEPARATORS = new Set([' ', ',', '+', '>', '~']);
const KEYFRAME_PERCENT = /\d+\.?\d*%/;

/** minify selector CSS */
function minifySelector(selector: string): string {
  return selector.replace(/(\r?\n|\s)+/g, ' ').replace(/\s*(,|\+|>|~|\(|\))\s*/g, '$1');
}

/** find matching paren */
function matchParen(search: string, start: number): number {
  if (search[start] !== '(') return -1;
  let parenCount = 0;
  for (let n = start + 1; n < search.length; n++) {
    if (search[n] === ')' && parenCount === 0) return n;
    if (search[n] === '(') parenCount += 1;
    if (search[n] === ')') parenCount -= 1;
  }
  return -1;
}

/** HTML tags that should never get scoped classes */
export const NEVER_SCOPED_TAGS = new Set<string>(['base', 'body', 'font', 'frame', 'frameset', 'head', 'html', 'link', 'meta', 'noframes', 'noscript', 'script', 'style', 'title']);

/**
 * Scope Rules
 * Given a selector string (`.btn>span,.nav>span`), add an additional CSS class to every selector (`.btn.myClass>span.myClass,.nav.myClass>span.myClass`)
 * @param {string} selector The minified selector string to parse. Cannot contain arbitrary whitespace (other than child selector syntax).
 * @param {string} className The CSS class to apply.
 */
export function scopeRule(selector: string, className: string) {
  // if this is a keyframe keyword, return original selector
  if (selector === 'from' || selector === 'to' || KEYFRAME_PERCENT.test(selector)) {
    return selector;
  }

  // sanitize & normalize
  const input = minifySelector(selector);

  // For everything else, parse & scope
  const c = className.replace(/^\.?/, '.'); // make sure class always has leading '.'
  const selectors: Selector[] = [];
  let ss = input; // sanitize

  // Pass 1: parse selector string; extract top-level selectors
  {
    let start = 0;
    let lastValue = '';
    let parenCount = 0;
    for (let n = 0; n < ss.length; n++) {
      const isEnd = n === input.length - 1;
      if (input[n] === '(') parenCount += 1;
      if (input[n] === ')') parenCount -= 1;
      if (isEnd || (parenCount === 0 && CSS_SEPARATORS.has(input[n]))) {
        lastValue = input.substring(start, isEnd ? undefined : n);
        if (!lastValue) continue;
        selectors.push({ start, end: isEnd ? n + 1 : n, value: lastValue });
        start = n + 1;
      }
    }
  }

  // Pass 2: starting from end, transform selectors w/ scoped class
  for (let i = selectors.length - 1; i >= 0; i--) {
    const { start, end } = selectors[i];
    let value = selectors[i].value;
    const head = ss.substring(0, start);
    const tail = ss.substring(end);

    // leave :global() alone!
    if (value.includes(GLOBAL)) {
      let withoutGlobal = value;
      // :global() may appear multiple times; if so, extract contents of each and combine
      while (withoutGlobal.includes(GLOBAL)) {
        const globalStart = withoutGlobal.indexOf(GLOBAL);
        const globalParenOpen = globalStart + GLOBAL.length - 1;
        const globalEnd = matchParen(withoutGlobal, globalParenOpen);
        const globalContents = withoutGlobal.substring(globalParenOpen + 1, globalEnd);
        withoutGlobal = withoutGlobal.substring(0, globalStart) + globalContents + withoutGlobal.substring(globalEnd + 1);
      }
      ss = head + withoutGlobal + tail;
      continue;
    }

    // replace '*' with scoped class
    if (value.includes('*')) {
      ss = head + value.replace(/\*/g, c) + tail;
      continue;
    }

    // don’t scope body, title, etc.
    if (CSS_SEPARATORS.has(value) || NEVER_SCOPED_TAGS.has(value)) {
      ss = head + value + tail;
      continue;
    }

    // scope everything else (place class just before any pseudoclasses)
    let pseudoclassStart = -1;
    for (let n = 0; n < value.length; n++) {
      // note: CSS may allow backslash-escaped colons, which does not count as a pseudoclass
      if (value[n] === ':' && value[n - 1] !== '\\') {
        pseudoclassStart = n;
        break;
      }
    }
    if (pseudoclassStart !== -1) {
      ss = head + value.substring(0, pseudoclassStart) + c + value.substring(pseudoclassStart) + tail;
    } else {
      ss = head + value + c + tail;
    }
  }

  return ss;
}

/** PostCSS Scope plugin */
export default function astroScopedStyles(options: AstroScopedOptions): Plugin {
  const rulesScopedCache = new WeakSet();
  return {
    postcssPlugin: '@astrojs/postcss-scoped-styles',
    Rule(rule) {
      if (!rulesScopedCache.has(rule)) {
        rule.selector = scopeRule(rule.selector, options.className);
        rulesScopedCache.add(rule);
      }
    },
  };
}
