import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup, setupBuild } from './helpers.js';

const Slots = suite('Slot test');

setup(Slots, './fixtures/astro-slots', {
  runtimeOptions: {
    mode: 'development',
  },
});
setupBuild(Slots, './fixtures/astro-slots');

Slots('Basic named slots work', async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'A');
  assert.equal($('#b').text(), 'B');
  assert.equal($('#c').text(), 'C');
  assert.equal($('#default').text(), 'Default');
});

Slots('Dynamic named slots work', async ({ runtime }) => {
  const result = await runtime.load('/dynamic');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'A');
  assert.equal($('#b').text(), 'B');
  assert.equal($('#c').text(), 'C');
  assert.equal($('#default').text(), 'Default');
});

Slots('Slots render fallback content by default', async ({ runtime }) => {
  const result = await runtime.load('/fallback');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#default').length, 1);
});

Slots('Slots override fallback content', async ({ runtime }) => {
  const result = await runtime.load('/fallback-override');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#override').length, 1);
});

Slots('Slots work with multiple elements', async ({ runtime }) => {
  const result = await runtime.load('/multiple');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'ABC');
});


Slots('Slots work on Components', async ({ runtime }) => {
  const result = await runtime.load('/component');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);

  assert.equal($('#a').length, 1);
  assert.equal($('#a').children('astro-component').length, 1, 'Slotted component into #a');
  assert.equal($('#default').children('astro-component').length, 1, 'Slotted component into default slot');
});


Slots.run();
