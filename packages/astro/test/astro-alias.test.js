import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Alias = suite('Alias test');

setup(Alias, './fixtures/astro-alias');
setupBuild(Alias, './fixtures/astro-alias');

Alias('Loads client-only packages', async ({ runtime }) => {
  let result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  // Grab the react-dom import
  const exp = /import\("(.+?)"\)/g;
  let match, reactRenderer;
  while ((match = exp.exec(result.contents))) {
    if (match[1].includes('renderers/renderer-react/client.js')) {
      reactRenderer = match[1];
    }
  }

  assert.ok(reactRenderer, 'React renderer is on the page');

  result = await runtime.load(reactRenderer);
  assert.equal(result.statusCode, 200, 'Can load react renderer');
});

Alias('Can be built', async ({ build }) => {
  try {
    await build();
    assert.ok(true, 'Can build a project with svelte dynamic components');
  } catch (err) {
    console.log(err);
    assert.ok(false, 'build threw');
  }
});

Alias.run();
