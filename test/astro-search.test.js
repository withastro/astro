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

Search('A URL with a trailing slash can match a folder with an index.astro', async ({ runtime }) => {
  const result = await runtime.load('/nested-astro/');
  assert.equal(result.statusCode, 200);
});

Search('A URL with a trailing slash can match a folder with an index.md', async ({ runtime }) => {
  const result = await runtime.load('/nested-md/');
  assert.equal(result.statusCode, 200);
});

Search('A URL without a trailing slash can redirect to a folder with an index.astro', async ({ runtime }) => {
  const result = await runtime.load('/nested-astro');
  assert.equal(result.statusCode, 301);
  assert.equal(result.location, '/nested-astro/');
});

Search('A URL without a trailing slash can redirect to a folder with an index.md', async ({ runtime }) => {
  const result = await runtime.load('/nested-md');
  assert.equal(result.statusCode, 301);
  assert.equal(result.location, '/nested-md/');
});

Search.run();
