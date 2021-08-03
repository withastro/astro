import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Fetch = suite('Global Fetch');

setup(Fetch, './fixtures/fetch');

Fetch('Is available in non-Astro components.', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#jsx').text(), 'function');
});

Fetch.run();
