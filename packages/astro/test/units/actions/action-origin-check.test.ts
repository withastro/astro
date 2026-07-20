import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { defineAction } from '../../../dist/actions/runtime/server.js';
import { appSymbol } from '../../../dist/core/constants.js';
import { actions, middleware, pages } from '../../../dist/core/hono/index.js';
import { createPage, createRouteData, createTestApp } from '../mocks.ts';
import { spreadPart, staticPart } from '../routing/test-helpers.ts';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

const noopPage = createComponent(() => render``);

const actionRouteData: RouteData = createRouteData({
	route: '/_actions/[...path]',
	type: 'endpoint',
	component: 'astro/actions/runtime/entrypoints/route.js',
	segments: [[staticPart('_actions')], [spreadPart('...path')]],
	pathname: undefined,
});

/**
 * Builds an App exposing a single `deleteAccount` form action, with the
 * origin check enabled (the default). `deleteAccount.ran` flips to `true`
 * only when the action handler actually executes, so tests can assert
 * whether a request reached the action.
 */
function createActionsApp() {
	const state = { ran: false };
	const app = createTestApp(
		[
			createPage(noopPage, { route: '/' }),
			{
				routeData: actionRouteData,
				module: (async () => ({
					page: () => import('../../../dist/actions/runtime/entrypoints/route.js'),
				})) as any,
			},
		],
		{
			checkOrigin: true,
			actionBodySizeLimit: 1024 * 1024,
			actions: () => ({
				server: {
					deleteAccount: defineAction({
						accept: 'form',
						handler: async () => {
							state.ran = true;
							return { deleted: 1 };
						},
					}),
				},
			}),
		},
	);
	return { app, actionState: state };
}

/**
 * Composes a Hono app around the given Astro app the way the `astro/hono`
 * primitives expect (the app is attached to the request; the primitives
 * derive their per-request `FetchState` from it). `actions()` is mounted
 * *before* `middleware()` — the order shipped in the `advanced-routing`
 * example — so the action dispatch runs before the origin-check middleware
 * would.
 */
function createHonoApp(astroApp: ReturnType<typeof createActionsApp>['app']) {
	const hono = new Hono();
	hono.use(async (context, next) => {
		Reflect.set(context.req.raw, appSymbol, astroApp);
		await next();
	});
	hono.use(actions());
	hono.use(middleware());
	hono.use(pages());
	return hono;
}

function actionRequest(origin: string) {
	return new Request('http://localhost/_actions/deleteAccount', {
		method: 'POST',
		headers: {
			origin,
			'content-type': 'application/x-www-form-urlencoded',
		},
		body: 'confirm=1',
	});
}

describe('Actions origin check with actions() mounted before middleware()', () => {
	it('blocks a cross-origin action request before it runs', async () => {
		const { app, actionState } = createActionsApp();
		const hono = createHonoApp(app);

		const res = await hono.fetch(actionRequest('http://evil.example'));

		assert.equal(res.status, 403);
		assert.equal(actionState.ran, false, 'the action must not run for a cross-origin request');
	});

	it('allows a same-origin action request', async () => {
		const { app, actionState } = createActionsApp();
		const hono = createHonoApp(app);

		const res = await hono.fetch(actionRequest('http://localhost'));

		assert.equal(res.ok, true);
		assert.equal(actionState.ran, true, 'the action should run for a same-origin request');
	});
});
