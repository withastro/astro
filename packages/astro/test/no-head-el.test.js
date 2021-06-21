import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const NoHeadEl = suite('Documents without a head');

setup(NoHeadEl, './fixtures/no-head-el', {
  runtimeOptions: {
    mode: 'development',
  },
});

NoHeadEl('Places style and scripts before the first non-head element', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('title').next().is('link'), true, 'Link to css placed after the title');
  assert.equal($('title').next().next().is('link'), true, 'Link for a child component');
  assert.equal($('title').next().next().next().is('style'), true, 'astro-root style placed after the link');
  assert.equal($('title').next().next().next().next().is('script'), true, 'HMR script after the style');

  assert.equal($('script[src="/_snowpack/hmr-client.js"]').length, 1, 'Only the hmr client for the page');
});

NoHeadEl.run();
