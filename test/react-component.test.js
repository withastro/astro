import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const React = suite('React Components');

let runtime, setupError;

React.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/react-component', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  try {
    runtime = await createRuntime(astroConfig, {logging});
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

React('Can load page', async () => {
  const result = await runtime.load('/');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.equal($('h2').text(), 'Hello world!');
});

React.run();
