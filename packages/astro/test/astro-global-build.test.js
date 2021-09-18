import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const GlobalBuild = suite('Astro.* built');

setup(GlobalBuild, './fixtures/astro-global', {
  runtimeOptions: {
    mode: 'production',
  },
});

GlobalBuild('Astro.request.url in the build', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#pathname').text(), '/');
  assert.equal($('#child-pathname').text(), '/');
  assert.equal($('#nested-child-pathname').text(), '/');
});

GlobalBuild('Astro.request.canonicalURL in the build', async (context) => {
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

GlobalBuild('Astro.site in the build', async (context) => {
  const result = await context.runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#site').attr('href'), 'https://mysite.dev/blog/');
});

GlobalBuild('Astro.resolve in the build', async (context) => {
  const result = await context.runtime.load('/resolve');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('img').attr('src'), '/blog/_astro/src/images/penguin.png');
});

GlobalBuild.run();
