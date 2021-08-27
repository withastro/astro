import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup, setupBuild } from './helpers.js';
import { doc } from './test-utils.js';
import path from 'path';

const Scripts = suite('Hoisted scripts');

setup(Scripts, './fixtures/astro-scripts');
setupBuild(Scripts, './fixtures/astro-scripts');

Scripts('Moves external scripts up', async ({ runtime }) => {
  const result = await runtime.load('/external');
  if (result.error) throw new Error(result.error);
  assert.equal(result.statusCode, 200);
  const html = result.contents;

  const $ = doc(html);
  assert.equal($('head script[type="module"][data-astro="hoist"]').length, 2);
  assert.equal($('body script').length, 0);
});

Scripts('Moves inline scripts up', async ({ runtime }) => {
  const result = await runtime.load('/inline');
  if (result.error) throw new Error(result.error);
  assert.equal(result.statusCode, 200);
  const html = result.contents;

  const $ = doc(html);
  assert.equal($('head script[type="module"][data-astro="hoist"]').length, 1);
  assert.equal($('body script').length, 0);
});

Scripts('Builds the scripts to a single bundle', async ({ build, readFile }) => {
  try {
    await build();
  } catch (err) {
    console.error(err.stack);
    assert.ok(!err);
    return;
  }

  /* Inline page */
  let inline = await readFile('/inline/index.html');
  let $ = doc(inline);
  assert.equal($('script').length, 1, 'Just one entry module');
  assert.equal($('script').attr('data-astro'), undefined, 'attr removed');
  let entryURL = path.join('inline', $('script').attr('src'));
  let inlineEntryJS = await readFile(entryURL);
  assert.ok(inlineEntryJS, 'The JS exists');

  /* External page */
  let external = await readFile('/external/index.html');
  $ = doc(external);
  assert.equal($('script').length, 2, 'There are two scripts');
  let el = $('script').get(1);
  entryURL = path.join('external', $(el).attr('src'));
  let externalEntryJS = await readFile(entryURL);
  assert.ok(externalEntryJS, 'got JS');
});

Scripts.run();
