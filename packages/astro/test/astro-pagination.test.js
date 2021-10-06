import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const Global = suite('Astro.*');

setup(Global, './fixtures/astro-pagination');

Global('optional root page', async (context) => {
  {
    const result = await context.runtime.load('/posts/optional-root-page/');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
  {
    const result = await context.runtime.load('/posts/optional-root-page/2');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
  {
    const result = await context.runtime.load('/posts/optional-root-page/3');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
});

Global('named root page', async (context) => {
  {
    const result = await context.runtime.load('/posts/named-root-page/1');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
  {
    const result = await context.runtime.load('/posts/named-root-page/2');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
  {
    const result = await context.runtime.load('/posts/named-root-page/3');
    assert.ok(!result.error, `build error: ${result.error}`);
  }
});

Global('multiple params', async (context) => {
  {
    const result = await context.runtime.load('/posts/red/1');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('#page-a').text(), '1');
    assert.equal($('#page-b').text(), '1');
    assert.equal($('#filter').text(), 'red');
  }
  {
    const result = await context.runtime.load('/posts/blue/1');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('#page-a').text(), '1');
    assert.equal($('#page-b').text(), '1');
    assert.equal($('#filter').text(), 'blue');
  }
  {
    const result = await context.runtime.load('/posts/blue/2');
    assert.ok(!result.error, `build error: ${result.error}`);
    const $ = doc(result.contents);
    assert.equal($('#page-a').text(), '2');
    assert.equal($('#page-b').text(), '2');
    assert.equal($('#filter').text(), 'blue');
  }
});

Global.run();
