import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const DType = suite('doctype');

setup(DType, './fixtures/astro-doctype');

DType('Automatically prepends the standards mode doctype', async ({ runtime }) => {
  const result = await runtime.load('/prepend');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype html>'), 'Doctype always included');
});

DType('No attributes added when doctype is provided by user', async ({ runtime }) => {
  const result = await runtime.load('/provided');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype html>'), 'Doctype always included');
});

DType.skip('Preserves user provided doctype', async ({ runtime }) => {
  const result = await runtime.load('/preserve');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'), 'Doctype included was preserved');
});

DType('User provided doctype is case insensitive', async ({ runtime }) => {
  const result = await runtime.load('/capital');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'Doctype left alone');
  assert.not.ok(html.includes('</!DOCTYPE>'), 'There should not be a closing tag');
});

DType('Doctype can be provided in a layout', async ({ runtime }) => {
  const result = await runtime.load('/in-layout');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype html>'), 'doctype is at the front');

  const $ = doc(html);
  assert.equal($('head link').length, 1, 'A link inside of the head');
});

DType('Doctype is added in a layout without one', async ({ runtime }) => {
  const result = await runtime.load('/in-layout-no-doctype');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype html>'), 'doctype is at the front');
});

DType.run();
