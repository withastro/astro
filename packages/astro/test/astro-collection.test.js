import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Collections = suite('Collections');

setup(Collections, './fixtures/astro-collection');

Collections('shallow selector (*.md)', async ({ runtime }) => {
  const result = await runtime.load('/shallow');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);
  const urls = [
    ...$('#posts a').map(function () {
      return $(this).attr('href');
    }),
  ];
  // assert they loaded in newest -> oldest order (not alphabetical)
  assert.equal(urls, ['/post/three', '/post/two', '/post/one']);
});

Collections('deep selector (**/*.md)', async ({ runtime }) => {
  const result = await runtime.load('/nested');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);
  const urls = [
    ...$('#posts a').map(function () {
      return $(this).attr('href');
    }),
  ];
  assert.equal(urls, ['/post/nested/a', '/post/three', '/post/two', '/post/one']);
});

Collections('generates pagination successfully', async ({ runtime }) => {
  const result = await runtime.load('/paginated');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);
  const prev = $('#prev-page');
  const next = $('#next-page');
  assert.equal(prev.length, 0); // this is first page; should be missing
  assert.equal(next.length, 1); // this should be on-page
});

Collections('can load remote data', async ({ runtime }) => {
  const result = await runtime.load('/remote');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);

  const PACKAGES_TO_TEST = ['canvas-confetti', 'preact', 'svelte'];

  for (const pkg of PACKAGES_TO_TEST) {
    assert.ok($(`#pkg-${pkg}`).length);
  }
});

Collections.run();
