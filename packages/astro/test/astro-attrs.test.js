import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Attributes = suite('Attributes test');

setup(Attributes, './fixtures/astro-attrs');

Attributes('Passes attributes to elements as expected', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  const ids = ['false-str', 'true-str', 'false', 'true', 'empty', 'null', 'undefined'];
  const specs = ['false', 'true', undefined, '', '', undefined, undefined];

  let i = 0;
  for (const id of ids) {
    const spec = specs[i];
    const attr = $(`#${id}`).attr('attr');
    assert.equal(attr, spec, `Passes ${id} as "${spec}"`);
    i++;
  }
});

Attributes('Passes boolean attributes to components as expected', async ({ runtime }) => {
  const result = await runtime.load('/component');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#true').attr('attr'), 'attr-true');
  assert.equal($('#true').attr('type'), 'boolean');
  assert.equal($('#false').attr('attr'), 'attr-false');
  assert.equal($('#false').attr('type'), 'boolean');
});

Attributes('Passes namespaced attributes as expected', async ({ runtime }) => {
  const result = await runtime.load('/namespaced');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('div').attr('xmlns:happy'), 'https://example.com/schemas/happy');
  assert.equal($('img').attr('happy:smile'), 'sweet');
});

Attributes('Passes namespaced attributes to components as expected', async ({ runtime }) => {
  const result = await runtime.load('/namespaced-component');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal(
    $('span').attr('on:click'),
    Function.prototype.toString.call((event) => console.log(event))
  );
});

Attributes.run();
