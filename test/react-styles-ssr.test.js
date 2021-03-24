import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const React = suite('React Component: SSR Styling');

let runtime, setupError;

React.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/react-styles-ssr', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  try {
    runtime = await createRuntime(astroConfig, logging);
  } catch (err) {
    console.error(err);
    setupError = err;
  }
});

React.after(async () => {
  await runtime.shutdown();
});

React('No error creating the runtime', () => {
  assert.equal(setupError, undefined);
});

React('Can load hmx page', async () => {
  const result = await runtime.load('/');
  console.log(result);

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  console.log($.html());
});

React.run();
