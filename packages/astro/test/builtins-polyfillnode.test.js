import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Builtins = suite('Node builtins with polyfillNode option');

setup(Builtins, './fixtures/builtins-polyfillnode');

Builtins('Doesnt alias to node: prefix', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.match($('#url').text(), new RegExp('unicorn.jpg'));
});

Builtins.run();
