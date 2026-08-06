import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { Rewrites, applyRewriteToState } from '../../../dist/core/rewrites/handler.js';
import { AstroError } from '../../../dist/core/errors/errors.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createBasicPipeline } from '../test-utils.ts';
import { createPage, createRouteData, createTestApp } from '../mocks.ts';
import { dynamicPart, staticPart } from '../routing/test-helpers.ts';

function createState(
	request: Request,
	routeConfig: Parameters<typeof createRouteData>[0],
	manifestOverrides: Record<string, unknown> = {},
) {
	const routeData = createRouteData(routeConfig);
	const pipeline = createBasicPipeline({ manifest: manifestOverrides });
	const state = new FetchState(pipeline, request, {
		routeData,
		addCookieHeader: false,
		clientAddress: undefined,
		locals: undefined,
		prerenderedErrorPageFetch: fetch,
		waitUntil: undefined,
	});
	state.params = {};
	state.props = {};
	return state;
}

function makeTryRewriteResult(
	routeConfig: Parameters<typeof createRouteData>[0],
	pathname: string,
) {
	return {
		routeData: createRouteData(routeConfig),
		componentInstance: {} as any,
		newUrl: new URL(`http://example.com${pathname}`),
		pathname,
	};
}

// #region applyRewriteToState

describe('applyRewriteToState', () => {
	it('updates routeData to the rewrite target', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		const target = makeTryRewriteResult({ route: '/target' }, '/target');

		applyRewriteToState(state, '/target', target);

		assert.equal(state.routeData!.route, '/target');
	});

	it('updates pathname to the rewrite target', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		const target = makeTryRewriteResult({ route: '/target' }, '/target');

		applyRewriteToState(state, '/target', target);

		assert.equal(state.pathname, '/target');
	});

	it('updates params from the new route', () => {
		const state = createState(new Request('http://example.com/'), { route: '/' });
		const target = makeTryRewriteResult(
			{
				route: '/blog/[id]',
				segments: [[staticPart('blog')], [dynamicPart('id')]],
				pathname: undefined,
			},
			'/blog/hello',
		);

		applyRewriteToState(state, '/blog/hello', target);

		assert.equal(state.params!.id, 'hello');
	});

	it('sets isRewriting to true', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		assert.equal(state.isRewriting, false);

		const target = makeTryRewriteResult({ route: '/target' }, '/target');
		applyRewriteToState(state, '/target', target);

		assert.equal(state.isRewriting, true);
	});

	it('resets status to 200', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		state.status = 404;

		const target = makeTryRewriteResult({ route: '/target' }, '/target');
		applyRewriteToState(state, '/target', target);

		assert.equal(state.status, 200);
	});

	it('uses the Request directly when payload is a Request', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		const newRequest = new Request('http://example.com/target');
		const target = makeTryRewriteResult({ route: '/target' }, '/target');

		applyRewriteToState(state, newRequest, target);

		assert.equal(state.request, newRequest);
	});

	it('invalidates cached contexts after rewrite', () => {
		const state = createState(new Request('http://example.com/source'), { route: '/source' });
		// Simulate cached contexts
		state.props = { cached: true };
		state.actionApiContext = {} as any;
		state.apiContext = {} as any;

		const target = makeTryRewriteResult({ route: '/target' }, '/target');
		applyRewriteToState(state, '/target', target);

		assert.equal(state.props, null);
		assert.equal(state.actionApiContext, null);
		assert.equal(state.apiContext, null);
	});

	it('throws ForbiddenRewrite for SSR-to-prerender rewrite', () => {
		const state = createState(
			new Request('http://example.com/source'),
			{ route: '/source', prerender: false },
			{ serverLike: true },
		);
		const target = makeTryRewriteResult({ route: '/static', prerender: true }, '/static');

		assert.throws(
			() => applyRewriteToState(state, '/static', target),
			(err: any) => err instanceof AstroError,
		);
	});

	it('allows SSR-to-prerender rewrite for i18n fallback routes', () => {
		const state = createState(
			new Request('http://example.com/source'),
			{ route: '/source', prerender: false },
			{ serverLike: true },
		);
		const targetRouteData = createRouteData({ route: '/static', prerender: true });
		targetRouteData.fallbackRoutes = [createRouteData({ route: '/en/static' })];

		const target = {
			routeData: targetRouteData,
			componentInstance: {} as any,
			newUrl: new URL('http://example.com/static'),
			pathname: '/static',
		};

		// Should not throw
		applyRewriteToState(state, '/static', target);
		assert.equal(state.routeData!.route, '/static');
	});
});

// #endregion

// #region Rewrites.execute

describe('Rewrites.execute()', () => {
	const simplePage = createComponent(() => render`<h1>Hello</h1>`);
	const targetPage = createComponent(() => render`<h1>Target</h1>`);

	function createFetchState(app: ReturnType<typeof createTestApp>, url: string) {
		const request = new Request(url);
		return new FetchState(app.pipeline, request, {
			routeData: app.match(request)!,
			addCookieHeader: false,
			clientAddress: undefined,
			locals: undefined,
			prerenderedErrorPageFetch: fetch,
			waitUntil: undefined,
		});
	}

	it('resolves the rewrite target and renders the new page', async () => {
		const app = createTestApp([
			createPage(simplePage, { route: '/source' }),
			createPage(targetPage, { route: '/target' }),
		]);
		const state = createFetchState(app, 'http://example.com/source');

		const rewrites = new Rewrites();
		const response = await rewrites.execute(state, '/target');

		assert.equal(response.status, 200);
		assert.match(await response.text(), /<h1>Target<\/h1>/);
	});

	it('updates state to reflect the rewritten route', async () => {
		const app = createTestApp([
			createPage(simplePage, { route: '/source' }),
			createPage(targetPage, { route: '/target' }),
		]);
		const state = createFetchState(app, 'http://example.com/source');
		assert.equal(state.routeData!.route, '/source');

		const rewrites = new Rewrites();
		await rewrites.execute(state, '/target');

		assert.equal(state.routeData!.route, '/target');
		assert.equal(state.pathname, '/target');
		assert.equal(state.isRewriting, true);
	});

	it('resolves params for dynamic rewrite targets', async () => {
		const paramPage = createComponent((result: any) => {
			const Astro = result.createAstro({}, null);
			return render`<p>${Astro.params.id}</p>`;
		});

		const app = createTestApp([
			createPage(simplePage, { route: '/', isIndex: true }),
			createPage(paramPage, {
				route: '/blog/[id]',
				segments: [[staticPart('blog')], [dynamicPart('id')]],
				pathname: undefined,
			}),
		]);
		const state = createFetchState(app, 'http://example.com/');

		const rewrites = new Rewrites();
		const response = await rewrites.execute(state, '/blog/hello');

		assert.equal(response.status, 200);
		assert.match(await response.text(), /hello/);
		assert.equal(state.params!.id, 'hello');
	});

	it('returns 404 when rewrite target does not match any route', async () => {
		const app = createTestApp([createPage(simplePage, { route: '/source' })]);
		const state = createFetchState(app, 'http://example.com/source');

		const rewrites = new Rewrites();
		const response = await rewrites.execute(state, '/nowhere');

		assert.equal(response.status, 404);
	});
});

// #endregion
