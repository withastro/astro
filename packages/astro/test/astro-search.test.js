import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup } from './helpers.js';

const Search = suite('Search paths');

setup(Search, './fixtures/astro-basic');

Search('Finds the root page', async ({ runtime }) => {
  const result = await runtime.load('/');
  assert.equal(result.statusCode, 200);
});

Search('Matches pathname to filename', async ({ runtime }) => {
  const result = await runtime.load('/news');
  assert.equal(result.statusCode, 200);
});

Search('Matches pathname to a nested index.astro file', async ({ runtime }) => {
  const result = await runtime.load('/nested-astro');
  assert.equal(result.statusCode, 200);
});

Search('Matches pathname to a nested index.md file', async ({ runtime }) => {
  const result = await runtime.load('/nested-md');
  assert.equal(result.statusCode, 200);
});

// TODO(fks): Make this configurable
Search('Trailing slashes are not yet supported by the dev server', async ({ runtime }) => {
  assert.equal((await runtime.load('/news/')).statusCode, 404);
  assert.equal((await runtime.load('/nested-astro/')).statusCode, 404);
  assert.equal((await runtime.load('/nested-md/')).statusCode, 404);
});



Search.run();
