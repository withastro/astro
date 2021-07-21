import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const PreactComponent = suite('Preact component test');

setup(PreactComponent, './fixtures/preact-component');
setupBuild(PreactComponent, './fixtures/preact-component');

PreactComponent('Can load class component', async ({ runtime }) => {
  const result = await runtime.load('/class');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#class-component').length, 1, 'Can use class components');
});

PreactComponent('Can load function component', async ({ runtime }) => {
  const result = await runtime.load('/fn');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#fn-component').length, 1, 'Can use function components');
  assert.equal($('#arrow-fn-component').length, 1, 'Can use function components');
});

PreactComponent('Can use hooks', async ({ runtime }) => {
  const result = await runtime.load('/hooks');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#world').length, 1);
});

PreactComponent('Can export a Fragment', async ({ runtime }) => {
  const result = await runtime.load('/frag');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('body').children().length, 0, "nothing rendered but it didn't throw.");
});

PreactComponent('Can use a pragma comment', async ({ runtime }) => {
  const result = await runtime.load('/pragma-comment');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#pragma-comment').length, 1, "rendered the PragmaComment component.");
});


PreactComponent('Uses the new JSX transform', async ({ runtime }) => {
  const result = await runtime.load('/pragma-comment');

  // Grab the imports
  const exp = /import\("(.+?)"\)/g;
  let match, componentUrl;
  while ((match = exp.exec(result.contents))) {
    if (match[1].includes('PragmaComment.js')) {
      componentUrl = match[1];
      break;
    }
  }
  const component = await runtime.load(componentUrl);
  const jsxRuntime = component.imports.filter(i => i.specifier.includes('jsx-runtime'));

  assert.ok(jsxRuntime, 'preact/jsx-runtime is used for the component');
});

PreactComponent.run();
