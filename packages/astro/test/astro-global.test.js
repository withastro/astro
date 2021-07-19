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
});

Global('Astro.request.canonicalURL', async (context) => {
  // given a URL, expect the following canonical URL
  const canonicalURLs = {
    '/': 'https://mysite.dev/',
    '/post/post': 'https://mysite.dev/post/post/',
    '/posts': 'https://mysite.dev/posts/',
    '/posts/2': 'https://mysite.dev/posts/2/',
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
  assert.equal($('#site').attr('href'), 'https://mysite.dev');
});

Global.run();
