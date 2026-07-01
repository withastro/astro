import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { appSymbol } from '../../../dist/core/constants.js';
import { pages } from '../../../dist/core/hono/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createEndpoint, createPage, createTestApp } from '../mocks.ts';

const noopPage = createComponent(() => render``);

/**
 * Builds an App with a single on-demand `POST /api/delete` endpoint and the
 * origin check enabled (the default). `endpointState.ran` flips to `true`
 * only when the endpoint handler actually executes.
 */
function createEndpointApp() {
	const endpointState = { ran: false };
	const app = createTestApp(
		[
			createPage(noopPage, { route: '/' }),
			createEndpoint(
				{
					POST: () => {
						endpointState.ran = true;
						return new Response('deleted');
					},
				},
				{ route: '/api/delete' },
			),
		],
		{ checkOrigin: true },
	);
	return { app, endpointState };
}

/**
 * Composes a Hono app that dispatches through `pages()` *without* mounting
 * `middleware()` — a valid composition for a site with no custom middleware.
 * The origin check historically lived only in `middleware()`, so this
 * exercises the endpoint dispatch sink directly.
 */
function createHonoApp(astroApp: ReturnType<typeof createEndpointApp>['app']) {
	const hono = new Hono();
	hono.use(async (context, next) => {
		Reflect.set(context.req.raw, appSymbol, astroApp);
		await next();
	});
	hono.use(pages());
	return hono;
}

function endpointRequest(origin: string) {
	return new Request('http://localhost/api/delete', {
		method: 'POST',
		headers: {
			origin,
			'content-type': 'application/x-www-form-urlencoded',
		},
		body: 'x=1',
	});
}

describe('Endpoint origin check with pages() and no middleware()', () => {
	it('blocks a cross-origin endpoint request before it runs', async () => {
		const { app, endpointState } = createEndpointApp();
		const hono = createHonoApp(app);

		const res = await hono.fetch(endpointRequest('http://evil.example'));

		assert.equal(res.status, 403);
		assert.equal(endpointState.ran, false, 'the endpoint must not run for a cross-origin request');
	});

	it('allows a same-origin endpoint request', async () => {
		const { app, endpointState } = createEndpointApp();
		const hono = createHonoApp(app);

		const res = await hono.fetch(endpointRequest('http://localhost'));

		assert.equal(res.ok, true);
		assert.equal(endpointState.ran, true, 'the endpoint should run for a same-origin request');
	});
});
