import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Components = suite('Components tests');

setup(Components, './fixtures/astro-components');

Components('Astro components are able to render framework components', async ({ runtime }) => {
  let result = await runtime.load('/');
  if (result.error) throw new Error(result);

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

Components.run();
