import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const LitElement = suite('LitElement test');

setup(LitElement, './fixtures/lit-element');

LitElement('Renders a custom element by tag name', async ({ runtime }) => {
  // lit SSR is not currently supported on Node.js < 13
  if (process.versions.node <= '13') {
    return;
  }
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('my-element').attr('foo'), 'bar', 'attributes rendered');
  assert.ok($('my-element').html().includes(`<div>Testing...</div>`), 'shadow rendered');
});

// Skipped because not supported by Lit
LitElement.skip('Renders a custom element by the constructor', async ({ runtime }) => {
  const result = await runtime.load('/ctr');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('my-element').attr('foo'), 'bar', 'attributes rendered');
  assert.ok($('my-element').html().includes(`<div>Testing...</div>`), 'shadow rendered');
});

// The Lit renderer adds browser globals that interfere with other tests, so remove them now.
LitElement.after(() => {
  const globals = Object.keys(globalThis.window || {});
  globals.splice(globals.indexOf('global'), 1);
  for (let name of globals) {
    delete globalThis[name];
  }
});

LitElement.run();
