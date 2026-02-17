import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest } from './test-helpers.js';

const fooRouteData = {
	route: '/foo',
	component: 'src/pages/foo.astro',
	params: [],
	pathname: '/foo',
	distURL: [],
	pattern: /^\/foo\/?$/,
	segments: [[{ content: 'foo', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const apiRouteData = {
	route: '/api',
	component: 'src/pages/api.js',
	params: [],
	pathname: '/api',
	distURL: [],
	pattern: /^\/api\/?$/,
	segments: [[{ content: 'api', dynamic: false, spread: false }]],
	type: 'endpoint',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const errorRouteData = {
	route: '/go-to-error-page',
	component: 'src/pages/go-to-error-page.astro',
	params: [],
	pathname: '/go-to-error-page',
	distURL: [],
	pattern: /^\/go-to-error-page\/?$/,
	segments: [[{ content: 'go-to-error-page', dynamic: false, spread: false }]],
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

const internalErrorRouteData = {
	route: '/500',
	component: 'src/pages/500.astro',
	params: [],
	pathname: '/500',
	distURL: [],
	pattern: /^\/500\/?$/,
	segments: [[{ content: '500', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const fooPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1 id="foo">${Astro.locals.foo}</h1>`;
});

const notFoundPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1 id="foo">${Astro.locals.foo}</h1>`;
});

const internalErrorPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1 id="foo">${Astro.locals.foo}</h1>`;
});

const pageMap = new Map([
	[
		fooRouteData.component,
		async () => ({
			page: async () => ({
				default: fooPage,
			}),
		}),
	],
	[
		apiRouteData.component,
		async () => ({
			page: async () => ({
				GET: async ({ locals }) =>
					new Response(JSON.stringify({ ...locals }), {
						headers: {
							'Content-Type': 'application/json',
						},
					}),
			}),
		}),
	],
	[
		errorRouteData.component,
		async () => ({
			page: async () => ({
				default: createComponent(() => {
					throw new Error('boom');
				}),
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
	[
		internalErrorRouteData.component,
		async () => ({
			page: async () => ({
				default: internalErrorPage,
			}),
		}),
	],
]);

const app = new App(
	createManifest({
		routes: [
			{ routeData: fooRouteData },
			{ routeData: apiRouteData },
			{ routeData: errorRouteData },
			{ routeData: notFoundRouteData },
			{ routeData: internalErrorRouteData },
		],
		pageMap,
	}),
);

describe('SSR Astro.locals from server', () => {
	it('Can access Astro.locals in page', async () => {
		const request = new Request('http://example.com/foo');
		const locals = { foo: 'bar' };
		const response = await app.render(request, { locals });
		const html = await response.text();

		assert.match(html, /id="foo">bar/);
	});

	it('Can access Astro.locals in api context', async () => {
		const request = new Request('http://example.com/api');
		const locals = { foo: 'bar' };
		const response = await app.render(request, { routeData: undefined, locals });
		assert.equal(response.status, 200);
		const body = await response.json();

		assert.equal(body.foo, 'bar');
	});

	it('404.astro can access locals provided to app.render()', async () => {
		const request = new Request('http://example.com/slkfnasf');
		const locals = { foo: 'par' };
		const response = await app.render(request, { locals });
		assert.equal(response.status, 404);

		const html = await response.text();
		assert.match(html, /id="foo">par/);
	});

	it('500.astro can access locals provided to app.render()', async () => {
		const request = new Request('http://example.com/go-to-error-page');
		const locals = { foo: 'par' };
		const response = await app.render(request, { locals });
		assert.equal(response.status, 500);

		const html = await response.text();
		assert.match(html, /id="foo">par/);
	});
});
