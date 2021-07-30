import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Components = suite('Components tests');

setup(Components, './fixtures/astro-components');

Components('Astro components are able to render framework components', async ({ runtime }) => {
  let result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  const $astro = $('#astro');
  assert.equal($astro.children().length, 3, 'Renders astro component');

  const $react = $('#react');
  assert.not.type($react, 'undefined', 'Renders React component');

  const $vue = $('#vue');
  assert.not.type($vue, 'undefined', 'Renders Vue component');

  const $svelte = $('#svelte');
  assert.not.type($svelte, 'undefined', 'Renders Svelte component');
});

Components('Allows Components defined in frontmatter', async ({ runtime }) => {
  const result = await runtime.load('/frontmatter-component');
  const html = result.contents;
  const $ = doc(html);

  assert.equal($('h1').length, 1);
});

Components('Still throws an error for undefined components', async ({ runtime }) => {
  const result = await runtime.load('/undefined-component');
  assert.equal(result.statusCode, 500);
});

Components('Svelte component', async ({ runtime }) => {
  const result = await runtime.load('/client');
  const html = result.contents;
  assert.ok(!/"client:load": true/.test(html), 'Client attrs not added');
});

Components.run();
