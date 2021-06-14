import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import { doc } from './test-utils.js';

const React = suite('React Components');

let runtime, setupError;

React.before(async () => {
  const astroConfig = await loadConfig(fileURLToPath(new URL('./fixtures/react-component', import.meta.url)));

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

React.after(async () => {
  (await runtime) && runtime.shutdown();
});

React('No error creating the runtime', () => {
  assert.equal(setupError, undefined);
});

React('Can load React', async () => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#react-h2').text(), 'Hello world!');
  assert.equal($('#arrow-fn-component').length, 1, 'Can use function components');
});

React('Can load Vue', async () => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  assert.equal($('#vue-h2').text(), 'Hasta la vista, baby');
});

React('Get good error message when react import is forgotten', async () => {
  const result = await runtime.load('/forgot-import');

  assert.ok(result.error instanceof ReferenceError);
  assert.equal(result.error.message, 'React is not defined');
});

React.run();
