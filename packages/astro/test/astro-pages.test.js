import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Pages = suite('Pages tests');

setup(Pages, './fixtures/astro-pages');
setupBuild(Pages, './fixtures/astro-pages');

Pages('Can find page with "index" at the end file name', async ({ build, runtime }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });
  
  const result = await runtime.load('posts/name-with-index');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('h1').text(), 'Name with index');
});

Pages.run();
