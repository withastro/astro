import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest } from './test-helpers.js';

const statusRouteData = {
	route: '/status-code',
	component: 'src/pages/status-code.astro',
	params: [],
	pathname: '/status-code',
	distURL: [],
	pattern: /^\/status-code\/?$/,
	segments: [[{ content: 'status-code', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const someHeaderRouteData = {
	route: '/some-header',
	component: 'src/pages/some-header.astro',
	params: [],
	pathname: '/some-header',
	distURL: [],
	pattern: /^\/some-header\/?$/,
	segments: [[{ content: 'some-header', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const notFoundRouteData = {
	route: '/404',
	component: 'src/pages/404.astro',
	params: [],
	pathname: '/404',
	distURL: [],
	pattern: /^\/404\/?$/,
	segments: [[{ content: '404', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const statusPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	Astro.response.status = 404;
	Astro.response.statusText = 'Oops';
	Astro.response.headers.set('One-Two', 'three');
	return render`<h1>Testing</h1>`;
});

const someHeaderPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	Astro.response.headers.set('One-Two', 'three');
	Astro.response.headers.set('Four-Five', 'six');
	Astro.response.headers.set('Cache-Control', 'max-age=0, s-maxage=86400');
	return render`<h1>Testing</h1>`;
});

const notFoundPage = createComponent(() => {
	return render`<h1>Custom 404</h1>`;
});

const pageMap = new Map([
	[
		statusRouteData.component,
		async () => ({
			page: async () => ({
				default: statusPage,
			}),
		}),
	],
	[
		someHeaderRouteData.component,
		async () => ({
			page: async () => ({
				default: someHeaderPage,
			}),
		}),
	],
	[
		notFoundRouteData.component,
		async () => ({
			page: async () => ({
				default: notFoundPage,
			}),
		}),
	],
]);

const app = new App(
	createManifest({
		routes: [
			{ routeData: statusRouteData },
			{ routeData: someHeaderRouteData },
			{ routeData: notFoundRouteData },
		],
		pageMap,
	}),
);

describe('Using Astro.response in SSR', () => {
	it('Can set the status', async () => {
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.status, 404);
	});

	it('Can set the statusText', async () => {
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.statusText, 'Oops');
	});

	it('Can set headers for 404 page', async () => {
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		assert.equal(response.headers.get('one-two'), 'three');
	});

	it('Returns the page, not the custom 404.astro', async () => {
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		const html = await response.text();
		assert.equal(html.includes('<h1>Testing</h1>'), true);
		assert.equal(html.includes('<h1>Custom 404</h1>'), false);
	});

	it('Can add headers', async () => {
		const request = new Request('http://example.com/some-header');
		const response = await app.render(request);
		const headers = response.headers;
		assert.equal(headers.get('one-two'), 'three');
		assert.equal(headers.get('four-five'), 'six');
		assert.equal(headers.get('Cache-Control'), 'max-age=0, s-maxage=86400');
	});
});
