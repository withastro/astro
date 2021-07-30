import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Vue = suite('Vue component test');

setup(Vue, './fixtures/vue-component');
setupBuild(Vue, './fixtures/vue-component');

Vue('Can load Vue', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('h1').text(), 'Hello world!', 'Can use slots');
  assert.equal($('button').length, 2, 'Can render components');
  assert.equal($('pre').text(), "5", 'Can render nested components');
});

Vue.run();
