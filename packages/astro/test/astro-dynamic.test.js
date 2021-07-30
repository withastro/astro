import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';

const DynamicComponents = suite('Dynamic components tests');

setup(DynamicComponents, './fixtures/astro-dynamic');
setupBuild(DynamicComponents, './fixtures/astro-dynamic');

DynamicComponents('Loads client-only packages', async ({ runtime }) => {
  let result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

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

DynamicComponents('Loads pages using client:media hydrator', async ({ runtime }) => {
  let result = await runtime.load('/media');
  assert.ok(!result.error, `build error: ${result.error}`);

  let html = result.contents;
  assert.ok(html.includes(`value: "(max-width: 700px)"`), 'static value rendered');
  assert.ok(html.includes(`value: "(max-width: 600px)"`), 'dynamic value rendered');
});

DynamicComponents('Loads pages using client:only hydrator', async ({ runtime }) => {
  let result = await runtime.load('/client-only');
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

DynamicComponents('Can be built', async ({ build }) => {
  try {
    await build();
    assert.ok(true, 'Can build a project with svelte dynamic components');
  } catch (err) {
    console.log(err);
    assert.ok(false, 'build threw');
  }
});

DynamicComponents.run();
