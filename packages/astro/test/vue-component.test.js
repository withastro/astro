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
  const allPreValues = $('pre')
    .toArray()
    .map((el) => $(el).text());
  assert.equal(allPreValues, ['0', '1', '10', '100', '1000'], 'renders all components correctly');
  assert.equal($('astro-root').length, 4, 'renders 3 astro-roots');
  assert.equal($('astro-root[uid]').length, 4, 'all astro-roots have uid attributes');
  const uniqueRootUIDs = $('astro-root').map((i, el) => $(el).attr('uid'));
  assert.equal(new Set(uniqueRootUIDs).size, 4, 'all astro-roots have unique uid attributes');
});

Vue.run();
