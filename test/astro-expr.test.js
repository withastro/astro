import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Expressions = suite('Expressions');

setup(Expressions, './fixtures/astro-expr');

Expressions('Can load page', async ({ runtime }) => {
  const result = await runtime.load('/');

  assert.equal(result.statusCode, 200);
  
  const $ = doc(result.contents);

  for(let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of strings', async ({ runtime }) => {
  const result = await runtime.load('/strings');

  assert.equal(result.statusCode, 200);
  
  const $ = doc(result.contents);

  for(let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of line comments', async ({ runtime }) => {
  const result = await runtime.load('/line-comments');
  assert.equal(result.statusCode, 200);
  
  const $ = doc(result.contents);

  for(let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions('Ignores characters inside of multiline comments', async ({ runtime }) => {
  const result = await runtime.load('/multiline-comments');
  assert.equal(result.statusCode, 200);
  
  const $ = doc(result.contents);

  for(let col of ['red', 'yellow', 'blue']) {
    assert.equal($('#' + col).length, 1);
  }
});

Expressions.run();
