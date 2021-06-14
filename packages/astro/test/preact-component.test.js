import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const PreactComponent = suite('Preact component test');

setup(PreactComponent, './fixtures/preact-component');

PreactComponent('Can load class component', async ({ runtime }) => {
  const result = await runtime.load('/class');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#class-component').length, 1, 'Can use class components');
});

PreactComponent('Can load function component', async ({ runtime }) => {
  const result = await runtime.load('/fn');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#fn-component').length, 1, 'Can use function components');
  assert.equal($('#arrow-fn-component').length, 1, 'Can use function components');
});

PreactComponent('Can use hooks', async ({ runtime }) => {
  const result = await runtime.load('/hooks');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#world').length, 1);
});

PreactComponent.run();
