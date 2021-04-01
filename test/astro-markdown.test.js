import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const Markdown = suite('Astro Markdown');

let runtime, setupError;

Markdown.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/astro-markdown', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  try {
    runtime = await createRuntime(astroConfig, { logging });
  } catch (err) {
    console.error(err);
    setupError = err;
  }
});

Markdown.after(async () => {
  (await runtime) && runtime.shutdown();
});

Markdown('No errors creating a runtime', () => {
  assert.equal(setupError, undefined);
});

Markdown('Can load markdown pages with hmx', async () => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

Markdown('Can load more complex jsxy stuff', async () => {
  const result = await runtime.load('/complex');

  const $ = doc(result.contents);
  const $el = $('#test');
  assert.equal($el.text(), 'Hello world');
});

Markdown.run();
