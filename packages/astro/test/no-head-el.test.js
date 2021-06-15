import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const NoHeadEl = suite('Documents without a head');

setup(NoHeadEl, './fixtures/no-head-el');

NoHeadEl('works', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const html = result.contents;
  console.log('html', html);
  //assert.ok(/window\.HMR_WEBSOCKET_URL = window\.HMR_WEBSOCKET_URL || 'ws:\/\/localhost:5555'/.test(html), "Uses the user's websocket port");
});


NoHeadEl.run();
