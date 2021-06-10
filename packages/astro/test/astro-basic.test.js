import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Basics = suite('Basic test');

setup(Basics, './fixtures/astro-basic', {
  runtimeOptions: {
    mode: 'development'
  }
});

Basics('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('h1').text(), 'Hello world!');
});

Basics('Sets the HMR port when dynamic components used', async ({ runtime }) => {
  const result = await runtime.load('/client');
  const html = result.contents;
  assert.ok(/HMR_WEBSOCKET_URL/.test(html), 'Sets the websocket port');
});

Basics('Does not set the HMR port when no dynamic component used', async ({ runtime }) => {
  const result = await runtime.load('/');
  const html = result.contents;
  assert.ok(!/HMR_WEBSOCKET_URL/.test(html), 'Does not set the websocket port');
});

Basics.run();
