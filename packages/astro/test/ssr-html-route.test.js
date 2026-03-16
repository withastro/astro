import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('SSR: [slug].html.astro routing', () => {
  let fixture;
  let devServer;

  before(async () => {
    fixture = await loadFixture({
      root: './fixtures/ssr-html-route/',
    });
    devServer = await fixture.startDevServer();
  });

  after(async () => {
    if (devServer) await devServer.stop();
  });

  it('extracts params correctly from [slug].html.astro', async () => {
    const response = await fixture.fetch('/dummy.html');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Slug: dummy/);
  });

  it('should still work for standard [slug].astro by stripping .html from URL', async () => {
    const response = await fixture.fetch('/standard.html');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /standard/); 
  });

  it('should normalize index.html to /', async () => {
  const response = await fixture.fetch('/index.html');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Home/);
});
});
