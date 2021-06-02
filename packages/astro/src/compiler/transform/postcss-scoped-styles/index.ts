import { Declaration, Plugin } from 'postcss';

interface AstroScopedOptions {
  className: string;
}

interface Selector {
  start: number;
  end: number;
  value: string;
}

const CSS_SEPARATORS = new Set([' ', ',', '+', '>', '~']);
const KEYFRAME_PERCENT = /\d+\.?\d*%/;

/** HTML tags that should never get scoped classes */
export const NEVER_SCOPED_TAGS = new Set<string>(['base', 'body', 'font', 'frame', 'frameset', 'head', 'html', 'link', 'meta', 'noframes', 'noscript', 'script', 'style', 'title', '!doctype']);
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

  // For everything else, parse & scope
  const c = className.replace(/^\.?/, '.'); // make sure class always has leading '.'
  const selectors: Selector[] = [];
  let ss = selector; // final output

  // Pass 1: parse selector string; extract top-level selectors
  {
    let start = 0;
    let lastValue = '';
    let parensOpen = false;
    for (let n = 0; n < ss.length; n++) {
      const isEnd = n === selector.length - 1;
      if (selector[n] === '(') parensOpen = true;
      if (selector[n] === ')') parensOpen = false;
      if (isEnd || (parensOpen === false && CSS_SEPARATORS.has(selector[n]))) {
        lastValue = selector.substring(start, isEnd ? undefined : n);
        if (!lastValue) continue;
        selectors.push({ start, end: isEnd ? n + 1 : n, value: lastValue });
        start = n + 1;
      }
    }
  }

  // Pass 2: starting from end, transform selectors w/ scoped class
  for (let i = selectors.length - 1; i >= 0; i--) {
    const { start, end, value } = selectors[i];
    const head = ss.substring(0, start);
    const tail = ss.substring(end);

    // replace '*' with className
    if (value === '*') {
      ss = head + c + tail;
      continue;
    }

    // leave :global() alone!
    if (value.startsWith(':global(')) {
      ss =
        head +
        ss
          .substring(start, end)
          .replace(/^:global\(/, '')
          .replace(/\)$/, '') +
        tail;
      continue;
    }

    // don’t scope body, title, etc.
    if (CSS_SEPARATORS.has(value) || NEVER_SCOPED_TAGS.has(value)) {
      ss = head + value + tail;
      continue;
    }

    // scope everything else
    let newSelector = value;
    const pseudoIndex = newSelector.indexOf(':');
    if (pseudoIndex > 0) {
      // if there’s a pseudoclass (:focus or ::before)
      ss = head + newSelector.substring(0, pseudoIndex) + c + newSelector.substr(pseudoIndex) + tail;
    } else {
      ss = head + newSelector + c + tail;
    }
  }

  return ss;
}

/** PostCSS Scope plugin */
export default function astroScopedStyles(options: AstroScopedOptions): Plugin {
  return {
    postcssPlugin: '@astrojs/postcss-scoped-styles',
    Rule(rule) {
      rule.selector = scopeRule(rule.selector, options.className);
    },
  };
}
