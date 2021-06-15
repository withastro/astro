import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const NoHeadEl = suite('Documents without a head');

setup(NoHeadEl, './fixtures/no-head-el');

NoHeadEl('Places style and scripts before the first non-head element', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('title').next().is('style'), true, 'Style placed after the title');
  assert.equal($('title').next().next().is('script'), true, 'HMR script after the style');
});


NoHeadEl.run();
