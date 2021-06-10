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

Basics('Sets the HMR port', async ({ runtime }) => {
  const result = await runtime.load('/');
  const content = result.contents;
  assert.ok(/HMR_WEBSOCKET_URL/.test(content), 'Sets the websocket port');
});

Basics.run();
