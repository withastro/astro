import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const ComponentChildren = suite('Component children tests');

setup(ComponentChildren, './fixtures/astro-children');
setupBuild(ComponentChildren, './fixtures/astro-children');

ComponentChildren('Passes children to framework components', async ({ runtime }) => {
  let result = await runtime.load('/');

  assert.equal(result.statusCode, 200);
  const $ = doc(result.contents);

  const $preact = $('#preact');
  assert.equal($preact.text().trim(), 'Hello world', 'Can pass text to Preact components');

  const $vue = $('#vue');
  assert.equal($vue.text().trim(), 'Hello world', 'Can pass text to Vue components');

  const $svelte = $('#svelte');
  assert.equal($svelte.text().trim(), 'Hello world', 'Can pass text to Svelte components');
});

ComponentChildren('Can be built', async ({ build }) => {
  try {
    await build();
    assert.ok(true, 'Can build a project with component children');
  } catch (err) {
    console.log(err);
    assert.ok(false, 'build threw');
  }
});

ComponentChildren.run();
