import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const LitElement = suite('LitElement test');

setup(LitElement, './fixtures/lit-element');

LitElement('Renders a custom element by tag name', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('my-element').attr('foo'), 'bar', 'attributes rendered');
  assert.ok($('my-element').html().includes(`<div>Testing...</div>`), 'shadow rendered');
});

// Skipped because not supported by Lit
LitElement.skip('Renders a custom element by the constructor', async ({ runtime }) => {
  const result = await runtime.load('/ctr');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('my-element').attr('foo'), 'bar', 'attributes rendered');
  assert.ok($('my-element').html().includes(`<div>Testing...</div>`), 'shadow rendered');
});

LitElement.run();
