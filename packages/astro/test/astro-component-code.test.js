import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Components = suite('<Code>');

setup(Components, './fixtures/astro-component-code');

Components('<Code> without lang or theme', async ({ runtime }) => {
  let result = await runtime.load('/no-lang');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('style'), 'background-color: #2e3440ff', 'applies default theme');
  assert.equal($('pre > code').length, 1);
  assert.ok($('pre > code span').length > 1, 'contains some generated spans');
});

Components('<Code lang="...">', async ({ runtime }) => {
  let result = await runtime.load('/basic');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('class'), 'astro-code');
  assert.equal($('pre > code').length, 1);
  assert.ok($('pre > code span').length > 6, 'contains many generated spans');
});

Components('<Code theme="...">', async ({ runtime }) => {
  let result = await runtime.load('/custom-theme');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('class'), 'astro-code');
  assert.equal($('pre').attr('style'), 'background-color: #1E1E1E', 'applies custom theme');
});

Components('<Code lang="..." theme="css-variables">', async ({ runtime }) => {
  let result = await runtime.load('/css-theme');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('class'), 'astro-code');
  assert.equal($('pre, pre span').map((i, f) => f.attribs ? f.attribs.style : 'no style found').toArray(), [
    "background-color: var(--astro-code-color-background)",
    "color: var(--astro-code-token-constant)",
    "color: var(--astro-code-token-function)",
    "color: var(--astro-code-color-text)",
    "color: var(--astro-code-token-string-expression)",
    "color: var(--astro-code-color-text)",
  ]);
});

Components.run();
