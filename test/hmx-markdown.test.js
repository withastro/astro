import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const HMXMD = suite('HMX Markdown');

let runtime, setupError;

HMXMD.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/hmx-markdown', import.meta.url).pathname);
  
  const logging = {
    level: 'error',
    dest: process.stderr
  };

  try {
    runtime = await createRuntime(astroConfig, logging);
  } catch(err) {
    console.error(err);
    setupError = err;
  }
});

HMXMD.after(async () => {
  runtime && runtime.shutdown();
});

HMXMD('No errors creating a runtime', () => {
  assert.equal(setupError, undefined);
});

HMXMD('Can load markdown pages with hmx', async () => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

HMXMD.run();