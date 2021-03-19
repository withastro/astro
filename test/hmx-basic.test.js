import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { doc } from './test-utils.js';

const Basics = suite('HMX Basics');

let runtime;

Basics.before(async () => {
  const astroConfig = {
    projectRoot: new URL('./fixtures/hmx-basic/', import.meta.url),
    hmxRoot: new URL('./fixtures/hmx-basic/astro/', import.meta.url),
    dist: './_site'
  };
  
  const logging = {
    level: 'error',
    dest: process.stderr
  };

  runtime = await createRuntime(astroConfig, logging);
});

Basics.after(async () => {
  await runtime.shutdown();
});

Basics('Can load hmx page', async () => {
  const result = await runtime.load('/');

  assert.equal(result.statusCode, 200);
  const $ = doc(result.contents);

  assert.equal($('h1').text(), 'Hello world!');
});

Basics.run();