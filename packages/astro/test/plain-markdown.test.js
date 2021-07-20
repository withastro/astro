import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Markdown = suite('Plain Markdown tests');

setup(Markdown, './fixtures/plain-markdown');
setupBuild(Markdown, './fixtures/plain-markdown');

Markdown('Can load a simple markdown page with Astro', async ({ runtime }) => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);

  assert.equal($('p').first().text(), 'Hello world!');
  assert.equal($('#first').text(), 'Some content');
  assert.equal($('#interesting-topic').text(), 'Interesting Topic');
});

Markdown('Can load a realworld markdown page with Astro', async ({ runtime }) => {
  const result = await runtime.load('/realworld');
  assert.ok(!result.error, `build error: ${result.error}`);

  assert.equal(result.statusCode, 200);
  const $ = doc(result.contents);

  assert.equal($('pre').length, 7);
});

Markdown('Builds markdown pages for prod', async (context) => {
  await context.build();
});

Markdown.run();
