// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, maybeRenderHead, render } from '../../../dist/runtime/server/index.js';
import { createManifest } from './test-helpers.js';

describe('App render error pages', () => {
	it('preserves headers and body for 500 responses from routes', async () => {
		const routeData = {
			route: '/[...slug]',
			component: 'src/pages/[...slug].astro',
			params: ['...slug'],
			pathname: undefined,
			distURL: [],
			pattern: /^\/(.*?)\/?$/,
			segments: [[{ content: '...slug', dynamic: true, spread: true }]],
			type: 'endpoint',
			prerender: false,
			fallbackRoutes: [],
			isIndex: false,
			origin: 'project',
		};

		const pageMap = new Map([
			[
				routeData.component,
				async () => ({
					page: async () => ({
						ALL: async () =>
							new Response('oops', {
								status: 500,
								headers: {
									'X-Debug': '1234',
								},
							}),
					}),
				}),
			],
		]);

		const app = new App(createManifest({ routes: [{ routeData }], pageMap }));
		const request = new Request('http://example.com/any');
		const response = await app.render(request, { routeData });

		assert.equal(response.status, 500);
		assert.equal(response.headers.get('x-debug'), '1234');
		assert.match(await response.text(), /oops/);
	});

	it('renders the 404 page when an API route lacks a handler for the request method', async () => {
		const apiRouteData = {
			route: '/api/route',
			component: 'src/pages/api/route.js',
			params: [],
			pathname: '/api/route',
			distURL: [],
			pattern: /^\/api\/route\/?$/,
			segments: [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'route', dynamic: false, spread: false }],
			],
			type: 'endpoint',
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

		const notFoundPage = createComponent((_result) => {
			return render`<h1>Something went horribly wrong!</h1>`;
		});

		const pageMap = new Map([
			[
				apiRouteData.component,
				async () => ({
					page: async () => ({
						POST: async () => new Response(JSON.stringify({ ok: true })),
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
				routes: [{ routeData: apiRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			}),
		);
		const request = new Request('http://example.com/api/route', { method: 'PUT' });
		const response = await app.render(request, { routeData: apiRouteData });

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});

	it('renders the 404 page when a route does not match', async () => {
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

		const notFoundPage = createComponent(() => {
			return render`<h1>Something went horribly wrong!</h1>`;
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
		]);

		const app = new App(createManifest({ routes: [{ routeData: notFoundRouteData }], pageMap }));
		const request = new Request('http://example.com/some/fake/route');
		const response = await app.render(request);

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});

	it('renders the 404 page when a route does not match and routeData is provided', async () => {
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

		const notFoundPage = createComponent(() => {
			return render`<h1>Something went horribly wrong!</h1>`;
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
		]);

		const app = new App(createManifest({ routes: [{ routeData: notFoundRouteData }], pageMap }));
		const request = new Request('http://example.com/some/fake/route');
		const routeData = app.match(request);
		const response = await app.render(request, { routeData });

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});

	it('renders the 404 page with imports when a matching route returns 404', async () => {
		const blogRouteData = {
			route: '/blog/[...ssrPath]',
			component: 'src/pages/blog/[...ssrPath].astro',
			params: ['...ssrPath'],
			pathname: undefined,
			distURL: [],
			pattern: /^\/blog(?:\/(.*))?$/,
			segments: [
				[{ content: 'blog', dynamic: false, spread: false }],
				[{ content: '...ssrPath', dynamic: true, spread: true }],
			],
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

		const notFoundPage = createComponent((result) => {
			return render`${maybeRenderHead(result)}<h1>Something went horribly wrong!</h1>`;
		});

		const pageMap = new Map([
			[
				blogRouteData.component,
				async () => ({
					// Returning 404 should trigger 404 route
					page: async () => ({
						default: createComponent(() => new Response(null, { status: 404 })),
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
					{ routeData: blogRouteData },
					{
						routeData: notFoundRouteData,
						styles: [{ type: 'external', src: '/main.css' }],
					},
				],
				pageMap,
			}),
		);
		const request = new Request('http://example.com/blog/fake/route');
		const routeData = app.match(request);
		const response = await app.render(request, { routeData });

		assert.equal(response.status, 404);
		const html = await response.text();
		assert.match(html, /Something went horribly wrong!/);
		assert.match(html, /<link[^>]*href="\/main\.css"/);
	});

	it('renders the 500 page when a route throws an error', async () => {
		const errorRouteData = {
			route: '/causes-error',
			component: 'src/pages/causes-error.astro',
			params: [],
			pathname: '/causes-error',
			distURL: [],
			pattern: /^\/causes-error\/?$/,
			segments: [[{ content: 'causes-error', dynamic: false, spread: false }]],
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

		const internalErrorPage = createComponent(() => {
			return render`<h1>This is an error page</h1>`;
		});

		const pageMap = new Map([
			[
				errorRouteData.component,
				async () => ({
					page: async () => ({
						default: createComponent(() => {
							throw new Error('oops');
						}),
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
				routes: [{ routeData: errorRouteData }, { routeData: internalErrorRouteData }],
				pageMap,
			}),
		);
		const request = new Request('http://example.com/causes-error');
		const response = await app.render(request, { routeData: errorRouteData });

		assert.equal(response.status, 500);
		assert.match(await response.text(), /This is an error page/);
	});

	it('renders the 404 page when an API route lacks a handler in production', async () => {
		const apiRouteData = {
			route: '/api/route',
			component: 'src/pages/api/route.js',
			params: [],
			pathname: '/api/route',
			distURL: [],
			pattern: /^\/api\/route\/?$/,
			segments: [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'route', dynamic: false, spread: false }],
			],
			type: 'endpoint',
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

		const notFoundPage = createComponent((result) => {
			return render`${maybeRenderHead(result)}<h1>Something went horribly wrong!</h1>`;
		});

		const pageMap = new Map([
			[
				apiRouteData.component,
				async () => ({
					page: async () => ({
						POST: async () => new Response(JSON.stringify({ ok: true })),
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
				routes: [{ routeData: apiRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			}),
		);
		const request = new Request('http://example.com/api/route', { method: 'PUT' });
		const response = await app.render(request);

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});

	it('renders the 404 page when a route does not match with trailingSlash always', async () => {
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

		const notFoundPage = createComponent(() => {
			return render`<h1>Something went horribly wrong!</h1>`;
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
		]);

		const app = new App(
			createManifest({
				routes: [{ routeData: notFoundRouteData }],
				pageMap,
				trailingSlash: 'always',
			}),
		);
		const request = new Request('http://example.com/ajksalscla/');
		const response = await app.render(request);

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});

	it('renders the 404 page when a route does not match with trailingSlash always and routeData', async () => {
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

		const notFoundPage = createComponent(() => {
			return render`<h1>Something went horribly wrong!</h1>`;
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
		]);

		const app = new App(
			createManifest({
				routes: [{ routeData: notFoundRouteData }],
				pageMap,
				trailingSlash: 'always',
			}),
		);
		const request = new Request('http://example.com/ajksalscla/');
		const routeData = app.match(request);
		const response = await app.render(request, { routeData });

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Something went horribly wrong!/);
	});
});
