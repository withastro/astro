import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const CustomElements = suite('Custom Elements');

setup(CustomElements, './fixtures/custom-elements');

CustomElements('Work as constructors', async ({ runtime }) => {
  const result = await runtime.load('/ctr');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('my-element').length, 1, 'Element rendered');
  assert.equal($('my-element template[shadowroot=open]').length, 1, 'shadow rendered');
});

CustomElements('Works with exported tagName', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('my-element').length, 1, 'Element rendered');
  assert.equal($('my-element template[shadowroot=open]').length, 1, 'shadow rendered');
});

CustomElements('Hydration works with exported tagName', async ({ runtime }) => {
  const result = await runtime.load('/load');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);

  // SSR
  assert.equal($('my-element').length, 1, 'Element rendered');
  assert.equal($('my-element template[shadowroot=open]').length, 1, 'shadow rendered');

  // Hydration
  assert.ok(new RegExp('/_astro/src/components/my-element.js').test(html), 'Component URL is included');
});

CustomElements('Polyfills are added before the hydration script', async ({ runtime }) => {
  const result = await runtime.load('/load');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);

  assert.equal($('script[type=module]').length, 2);
  assert.equal($('script[type=module]').attr('src'), '/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
  assert.match($($('script[type=module]').get(1)).html(), new RegExp('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js'));
});

CustomElements('Polyfills are added even if not hydrating', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);

  assert.equal($('script[type=module]').length, 1);
  assert.equal($('script[type=module]').attr('src'), '/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
  assert.not.match($($('script[type=module]').get(1)).html(), new RegExp('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js'));
});

CustomElements('Custom elements not claimed by renderer are rendered as regular HTML', async ({ runtime }) => {
  const result = await runtime.load('/nossr');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('client-element').length, 1, 'Rendered the client-only element');
});

CustomElements.run();
