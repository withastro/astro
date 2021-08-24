import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const PageDirectoryUrl = suite('pageUrlFormat');

setupBuild(PageDirectoryUrl, './fixtures/astro-page-directory-url');

PageDirectoryUrl('outputs', async ({ build, readFile }) => {
  await build();
  assert.ok(await readFile('/client.html'));
  assert.ok(await readFile('/nested-md.html'));
  assert.ok(await readFile('/nested-astro.html'));
});

PageDirectoryUrl.run();
