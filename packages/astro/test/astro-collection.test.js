import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Collections = suite('Collections');

setup(Collections, './fixtures/astro-collection');

Collections('shallow selector (*.md)', async ({ runtime }) => {
  const result = await runtime.load('/shallow');
  assert.ok(!result.error, `build error: ${result.error}`);
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
  assert.ok(!result.error, `build error: ${result.error}`);
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
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  const prev = $('#prev-page');
  const next = $('#next-page');
  assert.equal(prev.length, 0); // this is first page; should be missing
  assert.equal(next.length, 1); // this should be on-page
});

Collections('can load remote data', async ({ runtime }) => {
  const result = await runtime.load('/remote');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);

  const PACKAGES_TO_TEST = ['canvas-confetti', 'preact', 'svelte'];

  for (const pkg of PACKAGES_TO_TEST) {
    assert.ok($(`#pkg-${pkg}`).length);
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

Collections('generates individual pages from a collection', async ({ runtime }) => {
  const PAGES_TO_TEST = [
    {
      slug: 'one',
      title: 'Post One',
    },
    {
      slug: 'two',
      title: 'Post Two',
    },
    {
      slug: 'three',
      title: 'Post Three',
    },
  ];

  for (const { slug, title } of PAGES_TO_TEST) {
    const result = await runtime.load(`/individual/${slug}`);
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);

    assert.ok($(`#${slug}`).length);
    assert.equal($(`h1`).text(), title);
  }
});

Collections('matches collection filename exactly', async ({ runtime }) => {
  const result = await runtime.load('/individuals');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);

  assert.ok($('#posts').length);
  const urls = [
    ...$('#posts a').map(function () {
      return $(this).attr('href');
    }),
  ];
  assert.equal(urls, ['/post/nested/a', '/post/three', '/post/two', '/post/one']);
});

Collections.run();
