import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Collections = suite('Collections');

setup(Collections, './fixtures/astro-collection');

Collections('generates pagination successfully', async ({ runtime }) => {
  const result = await runtime.load('/paginated');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  const prev = $('#prev-page');
  const next = $('#next-page');
  assert.equal(prev.length, 0); // this is first page; should be missing
  assert.equal(next.length, 1); // this should be on-page
});

Collections('can load remote data', async ({ runtime }) => {
  const PACKAGES_TO_TEST = ['canvas-confetti', 'preact', 'svelte'];
  for (const packageName of PACKAGES_TO_TEST) {
    const result = await runtime.load(`/remote/${packageName}`);
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.ok($(`#pkg-${packageName}`).length);
  }
});

Collections('generates pages grouped by author', async ({ runtime }) => {
  const AUTHORS_TO_TEST = [
    {
      id: 'author-one',
      posts: ['one', 'three'],
    },
    {
      id: 'author-two',
      posts: ['two'],
    },
    {
      id: 'author-three',
      posts: ['nested/a'],
    },
  ];

  for (const { id, posts } of AUTHORS_TO_TEST) {
    const result = await runtime.load(`/grouped/${id}`);
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);

    assert.ok($(`#${id}`).length);

    for (const post of posts) {
      assert.ok($(`a[href="/post/${post}"]`).length);
    }
  }
});

Collections.run();
