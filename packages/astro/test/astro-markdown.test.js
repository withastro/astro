import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Markdown = suite('Astro Markdown tests');

setup(Markdown, './fixtures/astro-markdown');
setupBuild(Markdown, './fixtures/astro-markdown');

Markdown('Can load markdown pages with Astro', async ({ runtime }) => {
  const result = await runtime.load('/post');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

Markdown('Can load more complex jsxy stuff', async ({ runtime }) => {
  const result = await runtime.load('/complex');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  const $el = $('#test');
  assert.equal($el.text(), 'Hello world');
});

Markdown('Runs code blocks through syntax highlighter', async ({ runtime }) => {
  const result = await runtime.load('/code');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  const $el = $('code span');
  assert.ok($el.length > 0, 'There are child spans in code blocks');
});

Markdown('Scoped styles should not break syntax highlight', async ({ runtime }) => {
  const result = await runtime.load('/scopedStyles-code');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.ok($('pre').is('[class]'), 'Pre tag has scopedStyle class passed down');
  assert.ok($('pre').hasClass('language-js'), 'Pre tag has correct language');
  assert.ok($('code').hasClass('language-js'), 'Code tag has correct language');
  assert.ok($('code span').length > 0, 'There are child spans in code blocks');
});

Markdown('Bundles client-side JS for prod', async (context) => {
  await context.build();

  const complexHtml = await context.readFile('/complex/index.html');
  assert.match(complexHtml, `import("/_astro/src/components/Counter.js"`);

  const counterJs = await context.readFile('/_astro/src/components/Counter.js');
  assert.ok(counterJs, 'Counter.jsx is bundled for prod');
});

Markdown('Renders correctly when deeply nested on a page', async ({ runtime }) => {
  const result = await runtime.load('/deep');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#deep').children().length, 3, 'Rendered all children');
  assert.equal($('.a').children().length, 1, 'Only rendered title in each section');
  assert.equal($('.b').children().length, 1, 'Only rendered title in each section');
  assert.equal($('.c').children().length, 1, 'Only rendered title in each section');

  assert.equal($('.a > h2').text(), 'A', 'Rendered title in correct section');
  assert.equal($('.b > h2').text(), 'B', 'Rendered title in correct section');
  assert.equal($('.c > h2').text(), 'C', 'Rendered title in correct section');
});

Markdown('Renders recursively', async ({ runtime }) => {
  const result = await runtime.load('/recursive');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('.a > h1').text(), 'A', 'Rendered title .a correctly');
  assert.equal($('.b > h1').text(), 'B', 'Rendered title .b correctly');
  assert.equal($('.c > h1').text(), 'C', 'Rendered title .c correctly');
});

Markdown('Renders dynamic content though the content attribute', async ({ runtime }) => {
  const result = await runtime.load('/external');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#outer').length, 1, 'Rendered markdown content');
  assert.equal($('#inner').length, 1, 'Nested markdown content');
  assert.ok($('#inner').is('[class]'), 'Scoped class passed down');
});

Markdown('Renders curly braces correctly', async ({ runtime }) => {
  const result = await runtime.load('/braces');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('code').length, 3, 'Rendered curly braces markdown content');
  assert.equal($('code:first-child').text(), '({})', 'Rendered curly braces markdown content');
  assert.equal($('code:nth-child(2)').text(), '{...props}', 'Rendered curly braces markdown content');
  assert.equal($('code:last-child').text(), '{/* JavaScript */}', 'Rendered curly braces markdown content');
});

Markdown('Does not close parent early when using content attribute (#494)', async ({ runtime }) => {
  const result = await runtime.load('/close');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#target').children().length, 2, '<Markdown content /> closed div#target early');
});

Markdown('Can render markdown with --- for horizontal rule', async ({ runtime }) => {
  const result = await runtime.load('/dash');
  assert.ok(!result.error, `build error: ${result.error}`);

  // It works!
});

Markdown.run();
