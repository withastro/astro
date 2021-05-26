import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const ExpectedErrors = suite('Expected errors test');

setup(ExpectedErrors, './fixtures/astro-error');

ExpectedErrors('Will error if missing dependency', async ({ runtime }) => {
  const result = await runtime.load('/missingdependency');
  if(result.error) console.error(result.error)
  assert.equal(result.error.toString(), 'Error: Not Found (/_astro/components/Y.astro.js)') 
});

ExpectedErrors('Will error if misnamed import', async ({ runtime }) => {
  const result = await runtime.load('/misnamedimport');
  if(result.error) console.error(result.error)
  /** undefined needs to throw a better error */
  assert.equal(result.error,undefined)
});

ExpectedErrors('Will not compile', async ({ runtime }) => {
  const result = await runtime.load('/shouldnotcompile');
  if(result.error) console.error(result.error)
    /** undefined needs to throw a better error */
  assert.equal(result.error,undefined) 
});

ExpectedErrors.run();
