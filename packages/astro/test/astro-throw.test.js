import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Throwable = suite('Throw test');

setup(Throwable, './fixtures/astro-throw', {
  runtimeOptions: {
    mode: 'development',
  },
});
setupBuild(Throwable, './fixtures/astro-throw');

Throwable('Can throw an error from an `.astro` file', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.equal(result.statusCode, 500);
  assert.equal(result.error.message, 'Oops!');
});

Throwable('Does not complete build when Error is thrown', async ({ build }) => {
  await build().catch((e) => {
    assert.ok(e, 'Build threw');
  });
});

Throwable.run();
