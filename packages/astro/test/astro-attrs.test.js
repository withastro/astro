import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Attributes = suite('Attributes test');

setup(Attributes, './fixtures/astro-attrs');

Attributes('Passes attributes to elements as expected', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  const ids = ['false-str', 'true-str', 'false', 'true', 'empty', 'null', 'undefined'];
  const specs = ['false', 'true', 'false', 'true', '', undefined, undefined];

  let i = 0;
  for (const id of ids) {
    const spec = specs[i];
    const attr = $(`#${id}`).attr('attr');
    assert.equal(attr, spec, `Passes ${id} as "${spec}"`);
    i++;
  }
});

Attributes.run();
