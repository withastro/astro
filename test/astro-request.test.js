import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Request = suite('import.meta.request');

setup(Request, './fixtures/astro-request');

Request('import.meta.request available', async (context) => {
  const result = await context.runtime.load('/');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.equal($('h1').text(), '/');
});

Request.run();
