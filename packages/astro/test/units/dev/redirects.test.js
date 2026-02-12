import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
	createFixture,
	createRequestAndResponse,
	startContainerFromFixture,
} from '../test-utils.js';

describe('Redirects in DEV mode (unit)', () => {
	// Group 1: Tests that share config redirects + dynamic route fixture
	describe('config redirects', () => {
		/** @type {import('fs-fixture').Fixture} */
		let fixture;
		/** @type {import('../../../src/core/dev/container.js').Container} */
		let container;

		before(async () => {
			fixture = await createFixture({
				'/src/pages/test.astro': `<html><head><title>Test</title></head><body><h1>Test</h1></body></html>`,
				'/src/pages/more/[dynamic].astro': `---
export const prerender = false;
---
{JSON.stringify(Astro.params)}`,
				'/src/pages/more/[dynamic]/[route].astro': `---
export const prerender = false;
---
{JSON.stringify(Astro.params)}`,
			});
			container = await startContainerFromFixture({
				inlineConfig: {
					root: fixture.path,
					output: 'static',
					redirects: {
						'/one': '/',
						'/more/old/[dynamic]': '/more/[dynamic]',
						'/more/old/[dynamic]/[route]': '/more/[dynamic]/[route]',
					},
				},
			});
		});

		after(async () => {
			await container.close();
			await fixture.rm();
		});

		it('performs simple redirects', async () => {
			const { req, res, done } = createRequestAndResponse({ method: 'GET', url: '/one' });
			container.handle(req, res);
			await done;
			assert.equal(res.statusCode, 301);
			assert.equal(res.getHeader('location'), '/');
		});

		it('performs dynamic redirects', async () => {
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/more/old/hello',
			});
			container.handle(req, res);
			await done;
			assert.equal(res.statusCode, 301);
			assert.equal(res.getHeader('location'), '/more/hello');
		});

		it('performs dynamic redirects with special characters', async () => {
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/more/old/%E2%80%99',
			});
			container.handle(req, res);
			await done;
			assert.equal(res.statusCode, 301);
			assert.equal(res.getHeader('location'), '/more/%E2%80%99');
		});

		it('performs dynamic redirects with multiple params', async () => {
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/more/old/hello/world',
			});
			container.handle(req, res);
			await done;
			assert.equal(res.getHeader('location'), '/more/hello/world');
		});
	});

	// Group 2: Astro.redirect
	describe('Astro.redirect', () => {
		/** @type {import('fs-fixture').Fixture} */
		let fixture;
		/** @type {import('../../../src/core/dev/container.js').Container} */
		let container;

		before(async () => {
			fixture = await createFixture({
				'/src/pages/secret.astro': `---\nreturn Astro.redirect('/login');\n---`,
				'/src/pages/login.astro': `<html><head></head><body><h1>Login</h1></body></html>`,
			});
			container = await startContainerFromFixture({
				inlineConfig: {
					root: fixture.path,
					security: { checkOrigin: false },
				},
			});
		});

		after(async () => {
			await container.close();
			await fixture.rm();
		});

		it('returns a 302 in dev mode', async () => {
			const { req, res, done } = createRequestAndResponse({ method: 'GET', url: '/secret' });
			container.handle(req, res);
			await done;
			assert.equal(res.statusCode, 302);
			assert.equal(res.getHeader('location'), '/login');
		});
	});

	// Group 3: Middleware redirects
	describe('middleware redirects', () => {
		/** @type {import('fs-fixture').Fixture} */
		let fixture;
		/** @type {import('../../../src/core/dev/container.js').Container} */
		let container;

		before(async () => {
			fixture = await createFixture({
				'/src/middleware.js': `
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(({ request }, next) => {
	if (new URL(request.url).pathname === '/middleware-redirect/') {
		return new Response(null, { status: 301, headers: { 'Location': '/test' } });
	}
	return next();
});`,
				'/src/pages/test.astro': `<html><head></head><body><h1>Test</h1></body></html>`,
				'/src/pages/middleware-redirect.astro': `<html><head></head><body><h1>Should redirect</h1></body></html>`,
			});
			container = await startContainerFromFixture({
				inlineConfig: {
					root: fixture.path,
					security: { checkOrigin: false },
				},
			});
		});

		after(async () => {
			await container.close();
			await fixture.rm();
		});

		it('supports middleware redirects in dev mode', async () => {
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/middleware-redirect/',
			});
			container.handle(req, res);
			await done;
			assert.equal(res.statusCode, 301);
			assert.equal(res.getHeader('location'), '/test');
		});
	});
});
