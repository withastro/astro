import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const MarkdownPlugin = suite('Astro Markdown plugin tests');

setup(MarkdownPlugin, './fixtures/astro-markdown-plugins');
setupBuild(MarkdownPlugin, './fixtures/astro-markdown-plugins');

MarkdownPlugin('Can render markdown with plugins', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('.toc').length, 1, 'Added a TOC');
  assert.ok($('#hello-world').hasClass('title'), 'Added .title to h1');
});

MarkdownPlugin('Can render Astro <Markdown> with plugins', async ({ runtime }) => {
  const result = await runtime.load('/astro');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('.toc').length, 1, 'Added a TOC');
  assert.ok($('#hello-world').hasClass('title'), 'Added .title to h1');
});

MarkdownPlugin.run();
