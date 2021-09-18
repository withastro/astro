import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Global = suite('Astro.*');

setup(Global, './fixtures/astro-global');

Global('Astro.request.url in development', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#pathname').text(), '/');
  assert.equal($('#child-pathname').text(), '/');
  assert.equal($('#nested-child-pathname').text(), '/');
});

Global('Astro.request.canonicalURL in development', async (context) => {
  // given a URL, expect the following canonical URL
  const canonicalURLs = {
    '/': 'http://localhost:3000/',
    '/post/post': 'http://localhost:3000/post/post/',
    '/posts/1': 'http://localhost:3000/posts/',
    '/posts/2': 'http://localhost:3000/posts/2/',
  };

  for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
    const result = await context.runtime.load(url);
    const $ = doc(result.contents);
    assert.equal($('link[rel="canonical"]').attr('href'), canonicalURL);
  }
});

Global('Astro.site in development', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#site').attr('href'), 'http://localhost:3000/');
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
