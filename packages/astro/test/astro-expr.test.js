import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Expressions = suite('Expressions');

setup(Expressions, './fixtures/astro-expr');

Expressions('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  for (let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of strings', async ({ runtime }) => {
  const result = await runtime.load('/strings');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  for (let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of line comments', async ({ runtime }) => {
  const result = await runtime.load('/line-comments');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  for (let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of multiline comments', async ({ runtime }) => {
  const result = await runtime.load('/multiline-comments');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  for (let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Allows multiple JSX children in mustache', async ({ runtime }) => {
  const result = await runtime.load('/multiple-children');
  if (result.error) throw new Error(result.error);

  assert.ok(result.contents.includes('#f') && !result.contents.includes('#t'));
});

Expressions.run();
