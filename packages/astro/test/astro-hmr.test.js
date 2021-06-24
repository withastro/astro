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
  assert.ok(/window\.HMR_WEBSOCKET_PORT = 5555/.test(html), "Uses the user's websocket port");
});

HMR('Does not override script added by the user', async ({ runtime }) => {
  const result = await runtime.load('/manual');
  if (result.error) throw new Error(result.error);

  const html = result.contents;

  assert.ok(/window\.HMR_WEBSOCKET_URL = 'wss:\/\/example.com:3333'/.test(html), "User's script included");
  assert.ok(/window\.HMR_WEBSOCKET_PORT = 5555/.test(html), 'Ignored when window.HMR_WEBSOCKET_URL set');
});

HMR('Adds script to static pages too', async ({ runtime }) => {
  const result = await runtime.load('/static');
  if (result.error) throw new Error(result.error);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('[src="/_snowpack/hmr-client.js"]').length, 1);
  assert.ok(/window\.HMR_WEBSOCKET_PORT/.test(html), 'websocket port added');
});

HMR.run();
