import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const React = suite('React Components');

let runtime;

React.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/react-component', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr
  };

  runtime = await createRuntime(astroConfig, logging);
});

React.after(async () => {
  await runtime.shutdown();
});

React.only('Can load hmx page', async () => {
  const result = await runtime.load('/');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.equal($('h2').text(), 'Hello world!');
});

React.run();