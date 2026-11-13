import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	createComponent,
	maybeRenderHead,
	render,
	renderHead,
} from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

/**
 * Page that reads Astro.clientAddress and renders it into a <div id="address">.
 */
const ClientAddressPage = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const address = Astro.clientAddress;
	return render`<html>
	<head>${renderHead()}</head>
	<body>
		${maybeRenderHead()}<div id="address">${address}</div>
	</body>
</html>`;
});

describe('Astro.clientAddress', () => {
	describe('SSR', () => {
		it('Can get the address (default)', async () => {
			const app = createTestApp([createPage(ClientAddressPage, { route: '/' })]);
			const request = new Request('http://example.com/');
			const response = await app.render(request, { clientAddress: '0.0.0.0' });
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#address').text(), '0.0.0.0');
		});

		it('app.render can provide the address', async () => {
			const app = createTestApp([createPage(ClientAddressPage, { route: '/' })]);
			const request = new Request('http://example.com/');
			const response = await app.render(request, { clientAddress: '1.1.1.1' });
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#address').text(), '1.1.1.1');
		});
	});

	describe('SSR adapter not providing address', () => {
		it('Returns 500 when clientAddress is not provided', async () => {
			const app = createTestApp([createPage(ClientAddressPage, { route: '/' })], {
				adapterName: 'test-adapter',
			});
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);
		});
	});

	describe('Prerendered route', () => {
		it('Prerendered routes are not served at runtime (404)', async () => {
			// In a real build, accessing Astro.clientAddress in a static page
			// throws during generation. At the App level, prerendered routes
			// are not served dynamically — the App returns 404.
			const app = createTestApp([createPage(ClientAddressPage, { route: '/', prerender: true })]);
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});
	});
});
