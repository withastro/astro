import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const HtmlEncodedChars = suite('HTML Encoded Characters');

setup(HtmlEncodedChars, './fixtures/html-encoded-characters');

HtmlEncodedChars("doesn't decode html entities", async ({ runtime }) => {
  const result = await runtime.load('/');
  if (result.error) throw new Error(result.error);

  const $ = doc(result.contents);
  // Note: although this may look like it's incorrectly decoding the chars,
  // Cheerio is showing how the browsers _should_ interpret the HTML. If it
  // wasn't working correctly, then the spaces would have been trimmed to a
  // single space.
  assert.equal($('h1').html(), '&nbsp;&nbsp;&nbsp;Hello, world;');
  assert.equal($('div p').html(), 'Nested elements? No problem.&nbsp;');
});

HtmlEncodedChars.run();
