import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const ComponentChildren = suite('Component children tests');

setup(ComponentChildren, './fixtures/astro-children');
setupBuild(ComponentChildren, './fixtures/astro-children');

ComponentChildren('Passes string children to framework components', async ({ runtime }) => {
  let result = await runtime.load('/strings');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  const $preact = $('#preact');
  assert.equal($preact.text().trim(), 'Hello world', 'Can pass text to Preact components');

  const $vue = $('#vue');
  assert.equal($vue.text().trim(), 'Hello world', 'Can pass text to Vue components');

  const $svelte = $('#svelte');
  assert.equal($svelte.text().trim(), 'Hello world', 'Can pass text to Svelte components');
});

ComponentChildren('Passes markup children to framework components', async ({ runtime }) => {
  let result = await runtime.load('/markup');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  const $preact = $('#preact > h1');
  assert.equal($preact.text().trim(), 'Hello world', 'Can pass markup to Preact components');

  const $vue = $('#vue > h1');
  assert.equal($vue.text().trim(), 'Hello world', 'Can pass markup to Vue components');

  const $svelte = $('#svelte > h1');
  assert.equal($svelte.text().trim(), 'Hello world', 'Can pass markup to Svelte components');
});

ComponentChildren('Passes multiple children to framework components', async ({ runtime }) => {
  let result = await runtime.load('/multiple');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  const $preact = $('#preact');
  assert.equal($preact.children().length, 2, 'Can pass multiple children to Preact components');
  assert.equal($preact.children(':first-child').text().trim(), 'Hello world');
  assert.equal($preact.children(':last-child').text().trim(), 'Goodbye world');

  const $vue = $('#vue');
  assert.equal($vue.children().length, 2, 'Can pass multiple children to Vue components');
  assert.equal($vue.children(':first-child').text().trim(), 'Hello world');
  assert.equal($vue.children(':last-child').text().trim(), 'Goodbye world');

  const $svelte = $('#svelte');
  assert.equal($svelte.children().length, 2, 'Can pass multiple children to Svelte components');
  assert.equal($svelte.children(':first-child').text().trim(), 'Hello world');
  assert.equal($svelte.children(':last-child').text().trim(), 'Goodbye world');
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
