import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';

const Assets = suite('Assets');

setup(Assets, './fixtures/astro-assets');
setupBuild(Assets, './fixtures/astro-assets');

Assets('srcset is copied in the build', async ({ build, readFile }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });

  let oneX = await readFile('/_astro/src/images/twitter.png');
  assert.ok(oneX, 'built the base image');

  let twoX = await readFile('/_astro/src/images/twitter@2x.png');
  assert.ok(twoX, 'built the 2x image');

  let threeX = await readFile('/_astro/src/images/twitter@3x.png');
  assert.ok(threeX, 'build the 3x image');
});

Assets.run();