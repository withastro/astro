/**
 * note(drew): test was commented-out as this is now handled by Vite. Do we need any tests here?
 */

import { loadFixture } from './test-utils.js';

describe.skip('HMR tests', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-hmr/' });
  });

  test('Honors the user provided port', async () => {
    const result = await runtime.load('/');
    assert.ok(!result.error, `build error: ${result.error}`);
    const html = result.contents;
    assert.ok(/window\.HMR_WEBSOCKET_PORT = 5555/.test(html), "Uses the user's websocket port");
  });

  test('Does not override script added by the user', async () => {
    const result = await runtime.load('/manual');
    assert.ok(!result.error, `build error: ${result.error}`);
    const html = result.contents;
    assert.ok(/window\.HMR_WEBSOCKET_URL = 'wss:\/\/example.com:3333'/.test(html), "User's script included");
    assert.ok(/window\.HMR_WEBSOCKET_PORT = 5555/.test(html), 'Ignored when window.HMR_WEBSOCKET_URL set');
  });

  test('Adds script to static pages too', async () => {
    const result = await runtime.load('/static');
    assert.ok(!result.error, `build error: ${result.error}`);
    const html = result.contents;
    const $ = doc(html);
    assert.equal($('[src="/_snowpack/hmr-client.js"]').length, 1);
    assert.ok(/window\.HMR_WEBSOCKET_PORT/.test(html), 'websocket port added');
  });

  test("Adds script to pages even if there aren't any elements in the template", async () => {
    const result = await runtime.load('/no-elements');
    assert.ok(!result.error, `build error: ${result.error}`);
    const html = result.contents;
    const $ = doc(html);
    assert.equal($('[src="/_snowpack/hmr-client.js"]').length, 1);
    assert.ok(/window\.HMR_WEBSOCKET_PORT/.test(html), 'websocket port added');
  });
});
