import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Basics = suite('Basic test');

setup(Basics, './fixtures/astro-basic');

Basics('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');

  assert.equal(result.statusCode, 200);
  const $ = doc(result.contents);

  assert.equal($('h1').text(), 'Hello world!');
});

Basics.run();
