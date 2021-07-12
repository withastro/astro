import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';

const DynamicComponents = suite('Dynamic components tests');

setup(DynamicComponents, './fixtures/astro-dynamic');
setupBuild(DynamicComponents, './fixtures/astro-dynamic');

DynamicComponents('Loads client-only packages', async ({ runtime }) => {
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

DynamicComponents('Loads pages using client:media hydrator', async ({ runtime }) => {
  let result = await runtime.load('/media');
  if (result.error) throw new Error(result.error);

  let html = result.contents;
  assert.ok(html.includes(`value: "(max-width: 700px)"`), 'static value rendered');
  assert.ok(html.includes(`value: "(max-width: 600px)"`), 'dynamic value rendered');
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
