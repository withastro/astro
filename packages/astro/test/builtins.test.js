import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Builtins = suite('Node builtins');

setup(Builtins, './fixtures/builtins');

Builtins('Can be used with the node: prefix', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  console.log(result.contents);
  const $ = doc(result.contents);

  assert.equal($('#version').text(), '1.2.0');
});

Builtins.run();
