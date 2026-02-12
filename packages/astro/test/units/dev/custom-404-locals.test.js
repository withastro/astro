import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	createFixture,
	createRequestAndResponse,
	startContainerFromFixture,
} from '../test-utils.js';

const clientLocalsSymbol = Symbol.for('astro.locals');

describe('Custom 404 locals', () => {
	/** @type {import('fs-fixture').Fixture} */
	let fixture;
	/** @type {import('../../../src/core/dev/container.js').Container} */
	let container;

	before(async () => {
		fixture = await createFixture({
			'/src/pages/index.astro': `
<html><head><title>Custom 404</title></head>
<body><h1>Home</h1></body></html>`,
			'/src/pages/404.astro': `
---
const runtime = Astro.locals.runtime
---
<html lang="en"><head><title>Not Found</title></head>
<body>
  <h1>Page not found</h1>
  <p class="message">This 404 is a dynamic HTML file.</p>
  <p class="runtime">{runtime}</p>
</body></html>`,
		});
		container = await startContainerFromFixture({
			inlineConfig: {
				root: fixture.path,
				site: 'http://example.com',
			},
		});
	});

	after(async () => {
		await container.close();
		await fixture.rm();
	});

	it('renders / normally', async () => {
		const { req, res, text } = createRequestAndResponse({ method: 'GET', url: '/' });
		Reflect.set(req, clientLocalsSymbol, { runtime: 'locals' });
		container.handle(req, res);
		const html = await text();
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Home');
	});

	it('renders 404 with locals for unknown routes', async () => {
		const { req, res, text } = createRequestAndResponse({ method: 'GET', url: '/a' });
		Reflect.set(req, clientLocalsSymbol, { runtime: 'locals' });
		container.handle(req, res);
		const html = await text();
		const $ = cheerio.load(html);
		assert.equal(res.statusCode, 404);
		assert.equal($('h1').text(), 'Page not found');
		assert.equal($('p.message').text(), 'This 404 is a dynamic HTML file.');
		assert.equal($('p.runtime').text(), 'locals');
	});
});
