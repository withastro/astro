import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Collections = suite('Collections');

setup(Collections, './fixtures/astro-collection');

Collections('generates list & sorts successfully', async ({ runtime }) => {
  const result = await runtime.load('/posts');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);
  const urls = [
    ...$('#posts a').map(function () {
      return $(this).attr('href');
    }),
  ];
  assert.equal(urls, ['/post/nested/a', '/post/three', '/post/two']);
});

Collections('generates pagination successfully', async ({ runtime }) => {
  const result = await runtime.load('/posts');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);
  const prev = $('#prev-page');
  const next = $('#next-page');
  assert.equal(prev.length, 0); // this is first page; should be missing
  assert.equal(next.length, 1); // this should be on-page
});

Collections.run();
