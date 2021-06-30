import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const FrameworkVue = suite('Vue framework test');

setup(FrameworkVue, './fixtures/framework-vue');
setupBuild(FrameworkVue, './fixtures/framework-vue');

FrameworkVue('Can load basic component', async ({ runtime }) => {
  const result = await runtime.load('/basic');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#basic').length, 1, 'Can use a basic component');
});

FrameworkVue('Can load reactive component', async ({ runtime }) => {
  const result = await runtime.load('/counter');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#counter').length, 1, 'Can use a reactive component');
});

FrameworkVue('Can load nested component', async ({ runtime }) => {
  const result = await runtime.load('/nested');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#nested').length, 1, 'Can use nested components');
  assert.equal($('#counter').length, 1, 'Can use nested components');
});

FrameworkVue('Can build', async ({ build }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });
  const clientHTML = await readFile('/nested/index.html');
  console.log({ clientHTML });
});

FrameworkVue.run();
