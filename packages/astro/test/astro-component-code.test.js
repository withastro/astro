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
  assert.equal($('pre').attr('style'), 'background-color: #0d1117; overflow-x: auto;', 'applies default and overflow');
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
  assert.ok($('pre > code span').length >= 6, 'contains many generated spans');
});

Components('<Code theme="...">', async ({ runtime }) => {
  let result = await runtime.load('/custom-theme');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('class'), 'astro-code');
  assert.equal($('pre').attr('style'), 'background-color: #2e3440ff; overflow-x: auto;', 'applies custom theme');
});

Components('<Code wrap>', async ({ runtime }) => { 
  {
    let result = await runtime.load('/wrap-true');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('pre').length, 1);
    assert.equal($('pre').attr('style'), 'background-color: #0d1117; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;', 'applies wrap overflow');
  }
  {
    let result = await runtime.load('/wrap-false');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('pre').length, 1);
    assert.equal($('pre').attr('style'), 'background-color: #0d1117; overflow-x: auto;', 'applies wrap overflow');
  }
  {
    let result = await runtime.load('/wrap-null');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('pre').length, 1);
    assert.equal($('pre').attr('style'), 'background-color: #0d1117', 'applies wrap overflow');
  }
});

Components('<Code lang="..." theme="css-variables">', async ({ runtime }) => {
  let result = await runtime.load('/css-theme');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('pre').length, 1);
  assert.equal($('pre').attr('class'), 'astro-code');
  assert.equal($('pre, pre span').map((i, f) => f.attribs ? f.attribs.style : 'no style found').toArray(), [
    "background-color: var(--astro-code-color-background); overflow-x: auto;",
    "color: var(--astro-code-token-constant)",
    "color: var(--astro-code-token-function)",
    "color: var(--astro-code-color-text)",
    "color: var(--astro-code-token-string-expression)",
    "color: var(--astro-code-color-text)",
  ]);
});

Components.run();
