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
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'A');
  assert.equal($('#b').text(), 'B');
  assert.equal($('#c').text(), 'C');
  assert.equal($('#default').text(), 'Default');
});

Slots('Dynamic named slots work', async ({ runtime }) => {
  const result = await runtime.load('/dynamic');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'A');
  assert.equal($('#b').text(), 'B');
  assert.equal($('#c').text(), 'C');
  assert.equal($('#default').text(), 'Default');
});

Slots('Slots render fallback content by default', async ({ runtime }) => {
  const result = await runtime.load('/fallback');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#default').length, 1);
});

Slots('Slots override fallback content', async ({ runtime }) => {
  const result = await runtime.load('/fallback-override');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#override').length, 1);
});

Slots('Slots work with multiple elements', async ({ runtime }) => {
  const result = await runtime.load('/multiple');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#a').text(), 'ABC');
});

Slots('Slots work on Components', async ({ runtime }) => {
  const result = await runtime.load('/component');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);

  assert.equal($('#a').length, 1);
  assert.equal($('#a').children('astro-component').length, 1, 'Slotted component into #a');
  assert.equal($('#default').children('astro-component').length, 1, 'Slotted component into default slot');
});

Slots('Slots API work on Components', async ({ runtime }) => {
  // IDs will exist whether the slots are filled or not
  {
    const result = await runtime.load('/slottedapi-default');
    assert.ok(!result.error, `build error: ${result.error}`);

    const $ = doc(result.contents);

    assert.equal($('#a').length, 1);
    assert.equal($('#b').length, 1);
    assert.equal($('#c').length, 1);
    assert.equal($('#default').length, 1);
  }

  // IDs will not exist because the slots are not filled
  {
    const result = await runtime.load('/slottedapi-empty');
    assert.ok(!result.error, `build error: ${result.error}`);

    const $ = doc(result.contents);

    assert.equal($('#a').length, 0);
    assert.equal($('#b').length, 0);
    assert.equal($('#c').length, 0);
    assert.equal($('#default').length, 0);
  }

  // IDs will exist because the slots are filled
  {
    const result = await runtime.load('/slottedapi-filled');
    assert.ok(!result.error, `build error: ${result.error}`);

    const $ = doc(result.contents);

    assert.equal($('#a').length, 1);
    assert.equal($('#b').length, 1);
    assert.equal($('#c').length, 1);

    assert.equal($('#default').length, 0); // the default slot is not filled
  }

  // Default ID will exist because the default slot is filled
  {
    const result = await runtime.load('/slottedapi-default-filled');
    assert.ok(!result.error, `build error: ${result.error}`);

    const $ = doc(result.contents);

    assert.equal($('#a').length, 0);
    assert.equal($('#b').length, 0);
    assert.equal($('#c').length, 0);

    assert.equal($('#default').length, 1); // the default slot is filled
  }
});

Slots.run();
