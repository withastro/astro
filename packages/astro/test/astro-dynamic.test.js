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
  let match, reactDomURL;
  while ((match = exp.exec(result.contents))) {
    if (match[1].includes('react-dom')) {
      reactDomURL = match[1];
    }
  }

  assert.ok(reactDomURL, 'React dom is on the page');

  result = await runtime.load(reactDomURL);
  assert.equal(result.statusCode, 200, 'Can load react-dom');
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
