import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Global = suite('Astro.*');

setup(Global, './fixtures/astro-global');

Global('Astro.request.url', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#pathname').text(), '/');
  assert.equal($('#child-pathname').text(), '/');
  assert.equal($('#nested-child-pathname').text(), '/');
});

Global('Astro.filename', async (context) => {
  const result = await context.runtime.load('/filename');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.match($('#filename').text(), 'test/fixtures/astro-global/src/pages/filename.astro');
  assert.match($('#child-filename').text(), '/test/fixtures/astro-global/src/components/Child.astro');
  assert.match($('#nested-child-filename').text(), '/test/fixtures/astro-global/src/components/NestedChild.astro');
});

Global('Astro.filename with getStaticPaths', async (context) => {
  // given a URL, expect the following astro filename
  const urls = {
    '/': 'index.astro',
    '/post/post': 'layouts/post.astro',
    '/posts/1': 'posts/[page].astro',
    '/posts/2': 'posts/[page].astro',
  };

  for (const [url, astroFilename] of Object.entries(urls)) {
    const result = await context.runtime.load(url);
    const $ = doc(result.contents);
    assert.match($('#filename').text(), astroFilename);
  }
});

Global('Astro.request.canonicalURL', async (context) => {
  // given a URL, expect the following canonical URL
  const canonicalURLs = {
    '/': 'https://mysite.dev/blog/',
    '/post/post': 'https://mysite.dev/blog/post/post/',
    '/posts/1': 'https://mysite.dev/blog/posts/',
    '/posts/2': 'https://mysite.dev/blog/posts/2/',
  };

  for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
    const result = await context.runtime.load(url);
    const $ = doc(result.contents);
    assert.equal($('link[rel="canonical"]').attr('href'), canonicalURL);
  }
});

Global('Astro.site', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#site').attr('href'), 'https://mysite.dev/blog/');
});

Global('Astro.resolve in development', async (context) => {
  const result = await context.runtime.load('/resolve');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('img').attr('src'), '/_astro/src/images/penguin.png');
  assert.equal($('#inner-child img').attr('src'), '/_astro/src/components/nested/images/penguin.png');
});

Global.run();
