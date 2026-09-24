import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import {
	createEndpoint,
	getRequestData,
	SERVER_ISLAND_COMPONENT,
} from '../../../dist/core/server-islands/endpoint.js';
import type { RenderOptions } from '../../../dist/core/server-islands/endpoint.js';
import { createKey, encryptString } from '../../../dist/core/encryption.js';
import {
	type AstroComponentFactory,
	createComponent,
	createHeadAndContent,
	maybeRenderHead,
	render,
	renderComponent,
	renderSlot,
} from '../../../dist/runtime/server/index.js';
import { createRouteData } from '../mocks.ts';
import { createBasicPipeline, renderThroughMiddleware } from '../test-utils.ts';

// #region Helpers

function isRenderOptions(result: Response | RenderOptions): result is RenderOptions {
	return !(result instanceof Response);
}

/**
 * Construct a minimal Request for testing getRequestData.
 */
function makeGetRequest(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/_server-islands/Island');
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return new Request(url.toString(), { method: 'GET' });
}

function makePostRequest(body: RenderOptions) {
	return new Request('http://localhost/_server-islands/Island', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

/**
 * Like makePostRequest but accepts any payload — used to test server-side
 * validation of intentionally malformed or invalid request bodies.
 */
function makeInvalidPostRequest(body: Record<string, unknown>) {
	return new Request('http://localhost/_server-islands/Island', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function makeMethodRequest(method = 'GET') {
	return new Request('http://localhost/_server-islands/Island', { method });
}

// #endregion

describe('getRequestData', () => {
	// #region GET requests
	describe('GET requests', () => {
		it('returns RenderOptions when all required params are present', async () => {
			const req = makeGetRequest({ s: 'slots', e: 'export', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedSlots, 'slots');
			assert.equal(result.encryptedComponentExport, 'export');
			assert.equal(result.encryptedProps, 'props');
		});

		it('returns 400 when `s` is missing', async () => {
			const req = makeGetRequest({ e: 'export', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when `e` is missing', async () => {
			const req = makeGetRequest({ s: 'slots', p: 'props' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when `p` is missing', async () => {
			const req = makeGetRequest({ s: 'slots', e: 'export' });
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('returns 400 when all params are missing', async () => {
			const req = makeGetRequest();
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('accepts empty-string param values (empty props / slots are valid)', async () => {
			const req = makeGetRequest({ s: '', e: 'export', p: '' });
			const result = await getRequestData(req);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedSlots, '');
			assert.equal(result.encryptedProps, '');
		});
	});
	// #endregion

	// #region POST requests
	describe('POST requests', () => {
		it('returns RenderOptions for a well-formed encrypted payload', async () => {
			const req = makePostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: 'encProps',
				encryptedSlots: 'encSlots',
			});
			const result = await getRequestData(req);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedComponentExport, 'encExport');
			assert.equal(result.encryptedProps, 'encProps');
			assert.equal(result.encryptedSlots, 'encSlots');
		});

		it('returns 400 when POST body contains plaintext `slots` object', async () => {
			const req = makeInvalidPostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: '',
				slots: { default: '<p>Hello</p>' },
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
			assert.ok(
				result.statusText.toLowerCase().includes('plaintext slots'),
				`Expected 'plaintext slots' in statusText, got: ${result.statusText}`,
			);
		});

		it('returns 400 when POST body contains plaintext `componentExport` string', async () => {
			const req = makeInvalidPostRequest({
				componentExport: 'default',
				encryptedProps: '',
				encryptedSlots: '',
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
			assert.ok(
				result.statusText.toLowerCase().includes('plaintext componentexport'),
				`Expected 'plaintext componentExport' in statusText, got: ${result.statusText}`,
			);
		});

		it('returns 400 when POST body is malformed JSON', async () => {
			const req = new Request('http://localhost/_server-islands/Island', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'not valid json {{{',
			});
			const result = await getRequestData(req);
			assert.ok(result instanceof Response);
			assert.equal(result.status, 400);
		});

		it('accepts empty strings for encryptedProps and encryptedSlots', async () => {
			const req = makePostRequest({
				encryptedComponentExport: 'encExport',
				encryptedProps: '',
				encryptedSlots: '',
			});
			const result = await getRequestData(req);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedProps, '');
			assert.equal(result.encryptedSlots, '');
		});

		it('only checks own properties for `slots` validation', async () => {
			// Temporarily pollute Object.prototype to simulate inherited properties
			(Object.prototype as any).slots = { default: 'polluted' };
			try {
				const req = makePostRequest({
					encryptedComponentExport: 'encExport',
					encryptedProps: 'encProps',
					encryptedSlots: 'encSlots',
				});
				const result = await getRequestData(req);
				assert.ok(
					isRenderOptions(result),
					`Expected RenderOptions but got Response with status ${result instanceof Response ? result.status : 'N/A'} — inherited 'slots' should not trigger rejection`,
				);
			} finally {
				delete (Object.prototype as any).slots;
			}
		});

		it('only checks own properties for `componentExport` validation', async () => {
			// Temporarily pollute Object.prototype to simulate inherited properties
			(Object.prototype as any).componentExport = 'default';
			try {
				const req = makePostRequest({
					encryptedComponentExport: 'encExport',
					encryptedProps: 'encProps',
					encryptedSlots: 'encSlots',
				});
				const result = await getRequestData(req);
				assert.ok(
					isRenderOptions(result),
					`Expected RenderOptions but got Response with status ${result instanceof Response ? result.status : 'N/A'} — inherited 'componentExport' should not trigger rejection`,
				);
			} finally {
				delete (Object.prototype as any).componentExport;
			}
		});
	});
	// #endregion

	// #region Body size limiting
	describe('POST body size limiting', () => {
		it('returns 413 when POST body exceeds the configured limit', async () => {
			const limit = 100; // 100 bytes
			// Create a body larger than the limit
			const largeBody = JSON.stringify({
				encryptedComponentExport: 'x'.repeat(200),
				encryptedProps: '',
				encryptedSlots: '',
			});
			const req = new Request('http://localhost/_server-islands/Island', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: largeBody,
			});
			const result = await getRequestData(req, limit);
			assert.ok(result instanceof Response, 'should return a Response');
			assert.equal(result.status, 413);
		});

		it('returns 413 when Content-Length header exceeds the configured limit', async () => {
			const limit = 100; // 100 bytes
			const smallBody = JSON.stringify({
				encryptedComponentExport: 'enc',
				encryptedProps: '',
				encryptedSlots: '',
			});
			const req = new Request('http://localhost/_server-islands/Island', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': '999999',
				},
				body: smallBody,
			});
			const result = await getRequestData(req, limit);
			assert.ok(result instanceof Response, 'should return a Response');
			assert.equal(result.status, 413);
		});

		it('accepts POST body within the configured limit', async () => {
			const limit = 10000; // 10KB
			const body = {
				encryptedComponentExport: 'encExport',
				encryptedProps: 'encProps',
				encryptedSlots: 'encSlots',
			};
			const req = new Request('http://localhost/_server-islands/Island', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const result = await getRequestData(req, limit);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedComponentExport, 'encExport');
		});

		it('uses default limit when no limit is specified', async () => {
			// This should work fine with the default 1MB limit
			const body = {
				encryptedComponentExport: 'encExport',
				encryptedProps: 'encProps',
				encryptedSlots: 'encSlots',
			};
			const req = makePostRequest(body);
			const result = await getRequestData(req);
			assert.ok(isRenderOptions(result), 'should not return a Response');
			assert.equal(result.encryptedComponentExport, 'encExport');
		});
	});
	// #endregion

	// #region Unsupported HTTP methods
	describe('unsupported HTTP methods', () => {
		for (const method of ['PUT', 'DELETE', 'PATCH', 'HEAD']) {
			it(`returns 405 for ${method}`, async () => {
				const req = makeMethodRequest(method);
				const result = await getRequestData(req);
				assert.ok(result instanceof Response);
				assert.equal(result.status, 405);
			});
		}
	});
	// #endregion
});

async function renderServerIsland(Component: AstroComponentFactory) {
	const key = await createKey();
	const pipeline = createBasicPipeline({
		manifest: {
			key: Promise.resolve(key),
			serverIslandMappings: async () => ({
				serverIslandMap: new Map([['ContentIsland', async () => ({ default: Component })]]),
			}),
		},
	});
	const encryptedExport = await encryptString(key, 'default', 'export:ContentIsland');
	const url = new URL('http://example.com/_server-islands/ContentIsland');
	url.searchParams.set('e', encryptedExport);
	url.searchParams.set('p', '');
	url.searchParams.set('s', '');
	const state = new FetchState(pipeline.manifest, new Request(url));
	state.routeData = createRouteData({
		route: '/_server-islands/[name]',
		component: SERVER_ISLAND_COMPONENT,
		segments: [
			[{ content: '_server-islands', dynamic: false, spread: false }],
			[{ content: 'name', dynamic: true, spread: false }],
		],
	});
	state.pathname = url.pathname;

	const response = await renderThroughMiddleware(state, createEndpoint(pipeline.manifest));
	return response.text();
}

describe('server island endpoint', () => {
	it('serializes propagated head assets into the fragment response', async () => {
		const Content = createComponent({
			factory() {
				return createHeadAndContent(
					'<style>.box{color:red}</style><link rel="stylesheet" href="/content.css"><script type="module" src="/content.js"></script>',
					render`${maybeRenderHead()}<div class="box">Island content</div>`,
				);
			},
			propagation: 'self',
		});
		const Island = createComponent(
			(result) => render`${renderComponent(result, 'Content', Content, {}, {})}`,
		);
		const $ = cheerio.load(await renderServerIsland(Island), null, false);

		assert.equal($('style').length, 1);
		assert.equal($('style').text(), '.box{color:red}');
		assert.equal($('link[rel="stylesheet"][href="/content.css"]').length, 1);
		assert.equal($('script[type="module"][src="/content.js"]').length, 1);
		assert.equal($('.box').text(), 'Island content');
		assert.equal($.root().contents().first().is('style'), true);
	});

	it('waits for async slots before serializing propagated head assets', async () => {
		const Content = createComponent({
			factory() {
				return createHeadAndContent(
					'<style>.async{color:red}</style>',
					render`<div class="async">Async content</div>`,
				);
			},
			propagation: 'self',
		});
		const Wrapper = createComponent({
			factory(result, _props, slots) {
				return render`<section>${renderSlot(result, slots.default)}</section>`;
			},
			propagation: 'in-tree',
		});
		const Island = createComponent(
			(result) =>
				render`${renderComponent(
					result,
					'Wrapper',
					Wrapper,
					{},
					{
						default: async () => {
							await new Promise((resolve) => setTimeout(resolve, 10));
							return render`${renderComponent(result, 'Content', Content, {}, {})}`;
						},
					},
				)}`,
		);
		const $ = cheerio.load(await renderServerIsland(Island), null, false);

		assert.equal($('style').text(), '.async{color:red}');
		assert.equal($('.async').text(), 'Async content');
		assert.equal($.root().contents().first().is('style'), true);
	});
});
