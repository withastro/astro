import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';
import { doc } from './test-utils.js';

const Markdown = suite('Astro Markdown tests');

setup(Markdown, './fixtures/astro-markdown');
setupBuild(Markdown, './fixtures/astro-markdown');


Markdown('Can load markdown pages with Astro', async ({ runtime }) => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

Markdown('Can load more complex jsxy stuff', async ({ runtime }) => {
  const result = await runtime.load('/complex');

  const $ = doc(result.contents);
  const $el = $('#test');
  assert.equal($el.text(), 'Hello world');
});

Markdown('Bundles client-side JS for prod', async ({ build }) => {
  try {
    await build();
    assert.ok(true, 'Can build a project with client-side JS');
  } catch (err) {
    console.log(err);
    assert.ok(false, 'build threw');
  }
});

Markdown.run();
