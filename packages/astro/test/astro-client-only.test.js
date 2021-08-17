import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';

const ClientOnlyComponents = suite('Client only components tests');

setup(ClientOnlyComponents, './fixtures/astro-client-only');
setupBuild(ClientOnlyComponents, './fixtures/astro-client-only');

ClientOnlyComponents('Loads pages using client:only hydrator', async ({ runtime }) => {
  let result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  let html = result.contents;

  const rootExp = /<astro-root\s[^>]*><\/astro-root>/;
  assert.ok(rootExp.exec(html), 'astro-root is empty');

  // Grab the svelte import
  const exp = /import\("(.+?)"\)/g;
  let match, svelteRenderer;
  while ((match = exp.exec(result.contents))) {
    if (match[1].includes('renderers/renderer-svelte/client.js')) {
      svelteRenderer = match[1];
    }
  }

  assert.ok(svelteRenderer, 'Svelte renderer is on the page');

  result = await runtime.load(svelteRenderer);
  assert.equal(result.statusCode, 200, 'Can load svelte renderer');
});

ClientOnlyComponents('Can be built', async ({ build }) => {
  try {
    await build();
    assert.ok(true, 'Can build a project with svelte dynamic components');
  } catch (err) {
    console.log(err);
    assert.ok(false, 'build threw');
  }
});

ClientOnlyComponents.run();
