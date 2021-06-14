import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const HMR = suite('HMR tests');

setup(HMR, './fixtures/astro-hmr', {
  runtimeOptions: {
    mode: 'development',
  },
});

HMR('Honors the user provided port', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const html = result.contents;
  assert.ok(/window\.HMR_WEBSOCKET_URL = window\.HMR_WEBSOCKET_URL || 'ws:\/\/localhost:5555'/.test(html), "Uses the user's websocket port");
});

HMR('Does not override script added by the user', async ({ runtime }) => {
  const result = await runtime.load('/manual');
  console.log(result.error);

  const html = result.contents;

  assert.ok(!/window\.HMR_WEBSOCKET_URL = 'ws:\/\/localhost:3333'/.test(html), 'Users script included');
  assert.ok(/window\.HMR_WEBSOCKET_URL = window\.HMR_WEBSOCKET_URL || 'ws:\/\/localhost:5555'/.test(html), 'Our script defers to the port already being set');
});

HMR.run();
