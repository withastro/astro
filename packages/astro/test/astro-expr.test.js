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

Expressions('Allows <> Fragments in expressions', async ({ runtime }) => {
  const result = await runtime.load('/multiple-children');
  if (result.error) throw new Error(result.error);
  const $ = doc(result.contents);

  assert.equal($('#fragment').children().length, 3);
  assert.equal($('#fragment').children('#a').length, 1);
  assert.equal($('#fragment').children('#b').length, 1);
  assert.equal($('#fragment').children('#c').length, 1);
})

Expressions('Does not render falsy values using &&', async ({ runtime }) => {
  const result = await runtime.load('/falsy');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#true').length, 1, `Expected {true && <span id="true" />} to render`);
  assert.equal($('#zero').text(), '0', `Expected {0 && "VALUE"} to render "0"`);
  assert.equal($('#false').length, 0, `Expected {false && <span id="false" />} not to render`);
  assert.equal($('#null').length, 0, `Expected {null && <span id="null" />} not to render`);
  assert.equal($('#undefined').length, 0, `Expected {undefined && <span id="undefined" />} not to render`);
});

Expressions.run();
