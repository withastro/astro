import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';
import {
	createBasicSettings,
	createFixture,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

const fileSystem = {
	'/src/pages/api.ts': `export const GET = () => new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })`,
	'/src/pages/dot.json.ts': `export const GET = () => new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })`,
	'/src/pages/pathname.ts': `export const GET = (ctx) => new Response(JSON.stringify({ pathname: ctx.url.pathname }), { headers: { 'content-type': 'application/json' } })`,
	'/src/pages/subpage.ts': `export const GET = (ctx) => new Response(JSON.stringify({ pathname: ctx.url.pathname }), { headers: { 'content-type': 'application/json' } })`,
};

describe('trailingSlash', () => {
	let fixture;
	let container;
	let baseContainer;
	let rootPathContainer;

	before(async () => {
		fixture = await createFixture(fileSystem);

		// Create the first container with trailingSlash: 'always'
		const settings = await createBasicSettings({
			root: fixture.path,
			trailingSlash: 'always',
			output: 'server',
			adapter: testAdapter(),
			integrations: [
				{
					name: 'test',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							injectRoute({
								pattern: '/injected',
								entrypoint: './src/pages/api.ts',
							});
							injectRoute({
								pattern: '/injected.json',
								entrypoint: './src/pages/api.ts',
							});
						},
					},
				},
			],
		});
		container = await createContainer({
			settings,
			logger: defaultLogger,
		});

		// Create the second container with base path and trailingSlash: 'never'
		const baseSettings = await createBasicSettings({
			root: fixture.path,
			trailingSlash: 'never',
			base: 'base',
			output: 'server',
			adapter: testAdapter(),
			integrations: [
				{
					name: 'test',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							injectRoute({
								pattern: '/',
								entrypoint: './src/pages/api.ts',
							});
							injectRoute({
								pattern: '/injected',
								entrypoint: './src/pages/api.ts',
							});
						},
					},
				},
			],
		});
		baseContainer = await createContainer({
			settings: baseSettings,
			logger: defaultLogger,
		});

		// Create a container specifically for testing root path with base
		const rootPathSettings = await createBasicSettings({
			root: fixture.path,
			trailingSlash: 'never',
			base: '/mybase',
			output: 'server',
			adapter: testAdapter(),
			integrations: [
				{
					name: 'test',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							// Inject a route at the root that returns Astro.url.pathname
							injectRoute({
								pattern: '/',
								entrypoint: './src/pages/pathname.ts',
							});
						},
					},
				},
			],
		});
		rootPathContainer = await createContainer({
			settings: rootPathSettings,
			logger: defaultLogger,
		});
	});

	after(async () => {
		await container.close();
		await baseContainer.close();
		await rootPathContainer.close();
	});

	// Tests for trailingSlash: 'always'
	it('should match the API route when request has a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api/',
		});
		container.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	it('should NOT match the API route when request lacks a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api',
		});
		container.handle(req, res);
		const html = await text();
		assert.equal(html.includes(`<span class="statusMessage">Not found</span>`), true);
		assert.equal(res.statusCode, 404);
	});

	it('should match an injected route when request has a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/injected/',
		});
		container.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	it('should NOT match an injected route when request lacks a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/injected',
		});
		container.handle(req, res);
		const html = await text();
		assert.equal(html.includes(`<span class="statusMessage">Not found</span>`), true);
		assert.equal(res.statusCode, 404);
	});

	it('should match an injected route when request has a file extension and no slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/injected.json',
		});
		container.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	it('should match the API route when request has a trailing slash, with a file extension', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/dot.json/',
		});
		container.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	it('should also match the API route when request lacks a trailing slash, with a file extension', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/dot.json',
		});
		container.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	// Tests for trailingSlash: 'never' with base path
	it('should not have trailing slash on root path when base is set and trailingSlash is never', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/base',
		});
		baseContainer.handle(req, res);
		const json = await text();
		assert.equal(json, '{"success":true}');
	});

	it('should not match root path with trailing slash when base is set and trailingSlash is never', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/base/',
		});
		baseContainer.handle(req, res);
		const html = await text();
		assert.equal(html.includes(`<span class="statusMessage">Not found</span>`), true);
		assert.equal(res.statusCode, 404);
	});

	// Test for issue #13736: Astro.url.pathname should respect trailingSlash config with base
	it('Astro.url.pathname should not have trailing slash on root path when base is set and trailingSlash is never', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/mybase',
		});
		rootPathContainer.handle(req, res);
		const json = await text();
		const data = JSON.parse(json);
		// The pathname should be /mybase without trailing slash (the core issue from #13736)
		assert.equal(data.pathname, '/mybase');
		assert.equal(res.statusCode, 200);
	});

	it('should return correct Astro.url.pathname for pages with base and trailingSlash never', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/base/pathname',
		});
		baseContainer.handle(req, res);
		const json = await text();
		const data = JSON.parse(json);
		// The pathname should be /base/pathname without trailing slash
		assert.equal(data.pathname, '/base/pathname');
	});

	it('should return correct Astro.url.pathname for subpage with base and trailingSlash never', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/base/subpage',
		});
		baseContainer.handle(req, res);
		const json = await text();
		const data = JSON.parse(json);
		// The pathname should be /base/subpage without trailing slash
		assert.equal(data.pathname, '/base/subpage');
	});
});
