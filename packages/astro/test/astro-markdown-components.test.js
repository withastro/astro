import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const MarkdownComponents = suite('Astro Markdown Components tests');

setup(MarkdownComponents, './fixtures/astro-markdown-components');
setupBuild(MarkdownComponents, './fixtures/astro-markdown-components');

MarkdownComponents('Can load mdc pages with Astro', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('h2').length, 1, 'There is an h2 added in markdown');
  assert.equal($('#counter').length, 1, 'Counter component added via a component from markdown');
});

MarkdownComponents('Bundles client-side JS for prod', async (context) => {
  await context.build();

  const complexHtml = await context.readFile('/index.html');
  assert.match(complexHtml, `import("/_astro/src/components/Counter.js"`);

  const counterJs = await context.readFile('/_astro/src/components/Counter.js');
  assert.ok(counterJs, 'Counter.jsx is bundled for prod');
});

MarkdownComponents.run();
