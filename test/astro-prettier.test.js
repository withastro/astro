import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { format } from './test-utils.js';
import { setup } from './helpers.js';

const Prettier = suite('Prettier formatting');

setup(Prettier, './fixtures/astro-expr');

Prettier('Can load page', async ({ readSrcFile }) => {
  const src = await readSrcFile('/index.astro');
  assert.not.type(src, 'undefined');

  const result = format(src);
  assert.not.type(result, 'undefined');
});

// Prettier('Ignores characters inside of strings', async ({ runtime }) => {
//   const result = await runtime.load('/strings');

//   assert.equal(result.statusCode, 200);

//   const $ = doc(result.contents);

//   for (let col of ['red', 'yellow', 'blue']) {
//     assert.equal($('#' + col).length, 1);
//   }
// });

// Prettier('Ignores characters inside of line comments', async ({ runtime }) => {
//   const result = await runtime.load('/line-comments');
//   assert.equal(result.statusCode, 200);

//   const $ = doc(result.contents);

//   for (let col of ['red', 'yellow', 'blue']) {
//     assert.equal($('#' + col).length, 1);
//   }
// });

// Prettier('Ignores characters inside of multiline comments', async ({ runtime }) => {
//   const result = await runtime.load('/multiline-comments');
//   assert.equal(result.statusCode, 200);

//   const $ = doc(result.contents);

//   for (let col of ['red', 'yellow', 'blue']) {
//     assert.equal($('#' + col).length, 1);
//   }
// });

Prettier.run();
