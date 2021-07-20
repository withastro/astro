import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Builtins = suite('Node builtins');

setup(Builtins, './fixtures/builtins');

Builtins('Can be used with the node: prefix', async ({ runtime }) => {
  // node:fs/promise is not supported in Node v12. Test currently throws.
  if (process.versions.node <= '13') {
    return;
  }
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#version').text(), '1.2.0');
  assert.equal($('#dep-version').text(), '0.0.1');
});

Builtins('Throw if using the non-prefixed version', async ({ runtime }) => {
  const result = await runtime.load('/bare');
  assert.ok(result.error, 'Produced an error');
  assert.ok(/Use node:fs instead/.test(result.error.message));
});

Builtins.run();
