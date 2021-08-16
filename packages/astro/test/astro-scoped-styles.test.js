import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { scopeRule } from '#astro/compiler';

const ScopedStyles = suite('Astro PostCSS Scoped Styles Plugin');

const className = 'astro-abcd1234';

ScopedStyles('Scopes rules correctly', () => {
  // Note: assume all selectors have no unnecessary spaces (i.e. must be minified)
  const tests = {
    '.class': `.class.${className}`,
    h1: `h1.${className}`,
    '.nav h1': `.nav.${className} h1.${className}`,
    '.class+.class': `.class.${className}+.class.${className}`,
    '.class~:global(a)': `.class.${className}~a`,
    '.class *': `.class.${className} .${className}`,
    '.class>*': `.class.${className}>.${className}`,
    '.class button:focus': `.class.${className} button.${className}:focus`,
    '.class h3::before': `.class.${className} h3.${className}::before`,
    'button:focus::before': `button.${className}:focus::before`,
    '.class :global(*)': `.class.${className} *`,
    '.class :global(.nav:not(.is-active))': `.class.${className} .nav:not(.is-active)`, // preserve nested parens
    '.class :global(ul li)': `.class.${className} ul li`, // allow doubly-scoped selectors
    '.class:not(.is-active)': `.class.${className}:not(.is-active)`, // Note: the :not() selector can NOT contain multiple classes, so this is correct; if this causes issues for some people then it‘s worth a discussion
    'body h1': `body h1.${className}`, // body shouldn‘t be scoped; it‘s not a component
    'html,body': `html,body`,
    from: 'from', // ignore keyframe keywords (below)
    to: 'to',
    '55%': '55%',
    '.class\\:class': `.class\\:class.${className}`, // classes can contain special characters if escaped
    '.class\\:class:focus': `.class\\:class.${className}:focus`,
  };

  for (const [given, expected] of Object.entries(tests)) {
    assert.equal(scopeRule(given, className), expected);
  }
});

ScopedStyles.run();
