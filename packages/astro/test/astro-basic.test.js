import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Basics = suite('Basic test');

setup(Basics, './fixtures/astro-basic', {
  runtimeOptions: {
    mode: 'development',
  },
});
setupBuild(Basics, './fixtures/astro-basic');

Basics('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('h1').text(), 'Hello world!');
});

Basics('Sets the HMR port when dynamic components used', async ({ runtime }) => {
  const result = await runtime.load('/client');
  const html = result.contents;
  assert.ok(/HMR_WEBSOCKET_PORT/.test(html), 'Sets the websocket port');
});

Basics('Correctly serializes boolean attributes', async ({ runtime }) => {
  const result = await runtime.load('/');
  const html = result.contents;
  const $ = doc(html);
  assert.equal($('h1').attr('data-something'), '');
  assert.equal($('h2').attr('not-data-ok'), '');
});

Basics('Selector with an empty body', async ({ runtime }) => {
  const result = await runtime.load('/empty-class');
  const html = result.contents;
  const $ = doc(html);
  assert.equal($('.author').length, 1, 'author class added');
});

Basics('Build does not include HMR client', async ({ build, readFile }) => {
  await build().catch((err) => {
    assert.ok(!err, 'Error during the build');
  });
  const clientHTML = await readFile('/client/index.html');
  const $ = doc(clientHTML);

  assert.equal($('script[src="/_snowpack/hmr-client.js"]').length, 0, 'No HMR client script');
  const hmrPortScript = $('script').filter((i, el) => {
    return $(el)
      .text()
      .match(/window\.HMR_WEBSOCKET_PORT/);
  });
  assert.equal(hmrPortScript.length, 0, 'No script setting the websocket port');
});

Basics('Allows forward-slashes in mustache tags (#407)', async ({ runtime }) => {
  const result = await runtime.load('/forward-slash');
  const html = result.contents;
  const $ = doc(html);

  assert.equal($('a[href="/post/one"]').length, 1);
  assert.equal($('a[href="/post/two"]').length, 1);
  assert.equal($('a[href="/post/three"]').length, 1);
});

Basics('Allows spread attributes (#521)', async ({ runtime }) => {
  const result = await runtime.load('/spread');
  const html = result.contents;
  const $ = doc(html);

  assert.equal($('#spread-leading').length, 1);
  assert.equal($('#spread-leading').attr('a'), '0');
  assert.equal($('#spread-leading').attr('b'), '1');
  assert.equal($('#spread-leading').attr('c'), '2');

  assert.equal($('#spread-trailing').length, 1);
  assert.equal($('#spread-trailing').attr('a'), '0');
  assert.equal($('#spread-trailing').attr('b'), '1');
  assert.equal($('#spread-trailing').attr('c'), '2');
});

Basics('Allows spread attributes with TypeScript (#521)', async ({ runtime }) => {
  const result = await runtime.load('/spread');
  const html = result.contents;
  const $ = doc(html);

  assert.equal($('#spread-ts').length, 1);
  assert.equal($('#spread-ts').attr('a'), '0');
  assert.equal($('#spread-ts').attr('b'), '1');
  assert.equal($('#spread-ts').attr('c'), '2');
});

Basics.run();
