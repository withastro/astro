import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Markdown = suite('Astro Markdown');

setup(Markdown, './fixtures/astro-markdown');
setupBuild(Markdown, './fixtures/astro-markdown');

Markdown('Can load markdown pages with hmx', async ({ runtime }) => {
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

Markdown('Bundles client-side JS for prod', async (context) => {
  await context.build();

  const complexHtml = await context.readFile('/complex/index.html');
  assert.match(complexHtml, `import("/_astro/components/Counter.js"`);

  const counterJs = await context.readFile('/_astro/components/Counter.js');
  assert.ok(counterJs, 'Counter.jsx is bundled for prod');
});

Markdown.run();
