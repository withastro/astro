import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Markdown = suite('Astro Markdown tests');

setup(Markdown, './fixtures/astro-markdown');
setupBuild(Markdown, './fixtures/astro-markdown');

Markdown('Can load markdown pages with Astro', async ({ runtime }) => {
  const result = await runtime.load('/post');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

Markdown('Can load more complex jsxy stuff', async ({ runtime }) => {
  const result = await runtime.load('/complex');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  const $el = $('#test');
  assert.equal($el.text(), 'Hello world');
});

Markdown('Runs code blocks through syntax highlighter', async ({ runtime }) => {
  const result = await runtime.load('/code');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  const $el = $('code span');
  assert.ok($el.length > 0, 'There are child spans in code blocks');
});

Markdown('Bundles client-side JS for prod', async (context) => {
  await context.build();

  const complexHtml = await context.readFile('/complex/index.html');
  assert.match(complexHtml, `import("/_astro/src/components/Counter.js"`);

  const counterJs = await context.readFile('/_astro/src/components/Counter.js');
  assert.ok(counterJs, 'Counter.jsx is bundled for prod');
});

Markdown('Renders content correctly when deeply nested on a page', async ({ runtime }) => {
  const result = await runtime.load('/deep');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#deep').children().length, 3, 'Rendered all children');
  assert.equal($('.a').children().length, 1, 'Only rendered title in each section');
  assert.equal($('.b').children().length, 1, 'Only rendered title in each section');
  assert.equal($('.c').children().length, 1, 'Only rendered title in each section');

  assert.equal($('.a > h2').text(), 'A', 'Rendered title in correct section');
  assert.equal($('.b > h2').text(), 'B', 'Rendered title in correct section');
  assert.equal($('.c > h2').text(), 'C', 'Rendered title in correct section');
});

Markdown('Renders dynamic content though the content attribute', async ({ runtime }) => {
  const result = await runtime.load('/external');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#outer').length, 1, 'Rendered markdown content');
  assert.equal($('#inner').length, 1, 'Nested markdown content');
  assert.ok($('#inner').is('[class]'), 'Scoped class passed down');
});

Markdown.run();
