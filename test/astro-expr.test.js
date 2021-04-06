import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Expressions = suite('Expressions');

setup(Expressions, './fixtures/astro-expr');

Expressions('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');

  console.log(result)
  assert.equal(result.statusCode, 200);
  console.log(result.contents);
});

Expressions.run();
