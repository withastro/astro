import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Missing = suite('Missing test');

setup(Missing, './fixtures/astro-error');

Missing('Will error if missing dependency', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.equal(result.error.toString(), 'Error: Not Found (/_astro/components/X.astro.js)') 

  // const $ = doc(result.contents);
  // assert.equal($('div').text(), 'a b');
});

Missing.run();
