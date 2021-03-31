import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Fallback = suite('Dynamic component fallback');

setup(Fallback, './fixtures/astro-fallback');

Fallback('Shows static content', async (context) => {
  const result = await context.runtime.load('/');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.equal($('#fallback').text(), 'static');
});

Fallback.run();
