// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.js';

const notFoundRouteData = {
	route: '/not-found',
	component: 'src/pages/not-found.astro',
	params: [],
	pathname: '/not-found',
	distURL: [],
	pattern: /^\/not-found\/?$/,
	segments: [[{ content: 'not-found', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const notFoundCustomRouteData = {
	route: '/not-found-custom',
	component: 'src/pages/not-found-custom.astro',
	params: [],
	pathname: '/not-found-custom',
	distURL: [],
	pattern: /^\/not-found-custom\/?$/,
	segments: [[{ content: 'not-found-custom', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const notFoundPage = createComponent(() => {
	return new Response(null, {
		status: 404,
		statusText: 'Not found',
	});
});

const notFoundCustomPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	Astro.response.status = 404;
	return render`<div>Custom 404</div>`;
});

const pageMap = new Map([
	[
		notFoundRouteData.component,
		async () => ({
			page: async () => ({
				default: notFoundPage,
			}),
		}),
	],
	[
		notFoundCustomRouteData.component,
		async () => ({
			page: async () => ({
				default: notFoundCustomPage,
			}),
		}),
	],
]);

const app = new App(
	createManifest({
		routes: [createRouteInfo(notFoundRouteData), createRouteInfo(notFoundCustomRouteData)],
		pageMap,
	}),
);

describe('Returning responses', () => {
	it('Works from a page', async () => {
		const response = await app.render(new Request('http://example.com/not-found'));
		assert.equal(response.status, 404);
	});

	it('Returns the default 404 if body is null', async () => {
		const response = await app.render(new Request('http://example.com/not-found'));
		const html = await response.text();

		assert.equal(response.status, 404);
		assert.equal(html.includes('<pre>Path: /not-found</pre>'), true);
	});

	it('Returns the page if body is not null', async () => {
		const response = await app.render(new Request('http://example.com/not-found-custom'));
		const html = await response.text();

		assert.equal(response.status, 404);
		assert.equal(html.includes('Custom 404'), true);
	});
});
