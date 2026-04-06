// @ts-check
/**
 * Unit tests for the renderPath() function in src/core/build/generate.ts.
 *
 * These tests exercise the page-generation logic (redirect handling, null-body
 * detection, HTML compression, public-conflict detection, header tracking) WITHOUT
 * running a Vite build. File I/O uses a real temporary directory that is cleaned
 * up after each describe block.
 *
 * The mock prerenderer (createMockPrerenderer) returns pre-defined Responses so
 * the Astro rendering pipeline is not involved at all.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { renderPath } from '../../../dist/core/build/generate.js';
import {
	createComponent,
	render as renderTemplate,
	renderComponent,
} from '../../../dist/runtime/server/index.js';
import { createMockPrerenderer, createStaticBuildOptions } from './test-helpers.js';
import { createRouteData } from '../mocks.js';

describe('renderPath()', () => {
	let options;

	before(async () => {
		options = await createStaticBuildOptions();
	});

	it('returns a Buffer body for a normal HTML page', async () => {
		const html = '<html><body>Hello</body></html>';
		const prerenderer = createMockPrerenderer({ '/': html });
		const route = createRouteData({ route: '/' });

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null, 'expected a result, not null');
		assert.ok(result.body instanceof Buffer, 'body should be a Buffer');
		assert.equal(result.body.toString(), html);
	});

	it('returns null when the response has no body', async () => {
		const prerenderer = createMockPrerenderer({ '/empty': new Response(null, { status: 200 }) });
		const route = createRouteData({ route: '/empty' });

		const result = await renderPath({
			prerenderer,
			pathname: '/empty',
			route,
			options,
			logger: options.logger,
		});

		assert.equal(result, null, 'empty body should yield null');
	});

	it('produces a redirect HTML body for a 301 response', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, { status: 301, headers: { location: '/new' } }),
		});
		const route = createRouteData({ route: '/old', type: 'page' });
		const redirectOptions = await createStaticBuildOptions({
			inlineConfig: { build: { redirects: true } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: redirectOptions,
			logger: redirectOptions.logger,
		});

		assert.ok(result !== null, 'redirect should produce a result');
		assert.ok(typeof result.body === 'string', 'redirect body should be a string');
		assert.ok(result.body.includes('/new'), 'redirect body should contain target path');
	});

	it('returns null for redirect routes when config.build.redirects is false', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, { status: 301, headers: { location: '/new' } }),
		});
		const route = createRouteData({ route: '/old', type: 'redirect' });
		const noRedirectOptions = await createStaticBuildOptions({
			inlineConfig: { build: { redirects: false } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: noRedirectOptions,
			logger: noRedirectOptions.logger,
		});

		assert.equal(
			result,
			null,
			'redirect should be suppressed when config.build.redirects is false',
		);
	});

	it('strips newlines from redirect body when compressHTML is true', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, { status: 301, headers: { location: '/new' } }),
		});
		const route = createRouteData({ route: '/old', type: 'page' });
		const compressOptions = await createStaticBuildOptions({
			inlineConfig: { compressHTML: true, build: { redirects: true } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: compressOptions,
			logger: compressOptions.logger,
		});

		assert.ok(result !== null);
		assert.ok(typeof result.body === 'string');
		assert.ok(!result.body.includes('\n'), 'newlines should be stripped when compressHTML is true');
	});

	it('populates routeToHeaders when adapter requests static headers', async () => {
		const prerenderer = createMockPrerenderer({ '/page': '<html><body>Page</body></html>' });
		const route = createRouteData({ route: '/page' });
		const routeToHeaders = new Map();
		const adapterOptions = await createStaticBuildOptions({
			adapter: { adapterFeatures: { staticHeaders: true } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/page',
			route,
			options: adapterOptions,
			routeToHeaders,
			logger: adapterOptions.logger,
		});

		assert.ok(result !== null);
		assert.ok(routeToHeaders.has('/page'), 'routeToHeaders should be populated for /page');
	});

	it('does NOT populate routeToHeaders when adapter does not request static headers', async () => {
		const prerenderer = createMockPrerenderer({ '/page': '<html><body>Page</body></html>' });
		const route = createRouteData({ route: '/page' });
		const routeToHeaders = new Map();

		await renderPath({
			prerenderer,
			pathname: '/page',
			route,
			options,
			routeToHeaders,
			logger: options.logger,
		});

		assert.equal(routeToHeaders.size, 0, 'routeToHeaders should remain empty');
	});

	it('returns null and warns when a public file conflicts with the output path', async () => {
		const prerenderer = createMockPrerenderer({ '/': '<html><body>Index</body></html>' });
		const route = createRouteData({ route: '/' });

		// Pre-populate the temp dir with a public file at the conflicting path
		const conflictOptions = await createStaticBuildOptions({
			pages: { 'public/index.html': '<html>public file</html>' },
		});

		const warnings = [];
		conflictOptions.logger.warn = (_label, msg) => warnings.push(msg);

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options: conflictOptions,
			logger: conflictOptions.logger,
		});

		assert.equal(result, null, 'public conflict should yield null');
		assert.equal(warnings.length, 1);
		// The warning message contains the component path and the relative file path
		assert.ok(warnings[0].includes('public folder'), 'warning should mention public folder');
		assert.ok(warnings[0].includes('index.html'), 'warning should name the conflicting file');
	});

	it('propagates renderer errors', async () => {
		const prerenderer = createMockPrerenderer({});
		prerenderer.render = async () => {
			throw new Error('render exploded');
		};
		const route = createRouteData({ route: '/boom' });

		const errors = [];
		options.logger.error = (_label, msg) => errors.push(msg);

		await assert.rejects(
			() => renderPath({ prerenderer, pathname: '/boom', route, options, logger: options.logger }),
			/render exploded/,
		);
		assert.ok(errors.length > 0, 'error should be logged before re-throwing');
	});

	// Regression: #16185 — extensionless endpoints with trailingSlash: 'always'
	// must have a trailing slash in the prerender request URL so that BaseApp.render()
	// does not emit a redirect instead of the endpoint's actual response.
	it('sends a trailing-slash request URL for extensionless endpoints when trailingSlash is always', async () => {
		const endpointOptions = await createStaticBuildOptions({
			inlineConfig: { trailingSlash: 'always' },
		});

		let capturedUrl;
		const prerenderer = createMockPrerenderer({ '/demo': 'hello' });
		const originalRender = prerenderer.render.bind(prerenderer);
		prerenderer.render = async (request, opts) => {
			capturedUrl = new URL(request.url);
			return originalRender(request, opts);
		};

		const route = createRouteData({
			route: '/demo',
			type: 'endpoint',
			trailingSlash: 'always',
			component: 'src/pages/demo.ts',
		});

		await renderPath({
			prerenderer,
			pathname: '/demo',
			route,
			options: endpointOptions,
			logger: endpointOptions.logger,
		});

		assert.ok(capturedUrl, 'prerenderer.render should have been called');
		assert.ok(
			capturedUrl.pathname.endsWith('/'),
			`expected trailing slash in request URL pathname, got "${capturedUrl.pathname}"`,
		);
	});

	it('writes the rendered body to the filesystem (integration smoke)', async () => {
		const html = '<html><body>Written to disk</body></html>';
		const prerenderer = createMockPrerenderer({ '/disk-test': html });
		const route = createRouteData({ route: '/disk-test' });

		const result = await renderPath({
			prerenderer,
			pathname: '/disk-test',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		// generatePathWithPrerenderer writes result.outFile to disk — verify the URL
		// points inside the temp dir and the body matches.
		assert.ok(result.outFile.href.startsWith(options.settings.config.outDir.href));
		assert.equal(result.body.toString(), html);
	});
});

// ---------------------------------------------------------------------------
// ComponentInstance rendering via createMockPrerenderer
// ---------------------------------------------------------------------------

describe('createMockPrerenderer with ComponentInstance', () => {
	let options;

	before(async () => {
		options = await createStaticBuildOptions();
	});

	it('renders a bare ComponentInstance to HTML via RenderContext', async () => {
		const Page = createComponent((_result) => renderTemplate`<h1>Hello from component</h1>`);
		const prerenderer = createMockPrerenderer({ '/': { default: Page } });
		const route = createRouteData({ route: '/' });

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null, 'expected a render result');
		const html = result.body.toString();
		assert.ok(
			html.includes('Hello from component'),
			'rendered HTML should contain component output',
		);
		assert.ok(
			html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'),
			'should include doctype',
		);
	});

	it('passes props to a ComponentInstance via the props key', async () => {
		const Page = createComponent(
			(_result, { title }) => renderTemplate`<title>${title}</title><h1>${title}</h1>`,
		);
		const prerenderer = createMockPrerenderer({
			'/blog/hello': { default: Page, props: { title: 'Hello World' } },
		});
		const route = createRouteData({ route: '/blog/hello' });

		const result = await renderPath({
			prerenderer,
			pathname: '/blog/hello',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(
			result.body.toString().includes('Hello World'),
			'props should be forwarded to the component',
		);
	});

	it('renders nested components', async () => {
		const Inner = createComponent(
			(_result, { label }) => renderTemplate`<span class="inner">${label}</span>`,
		);
		const Page = createComponent(
			(result) =>
				renderTemplate`<div>${renderComponent(result, 'Inner', Inner, { label: 'nested' })}</div>`,
		);
		const prerenderer = createMockPrerenderer({ '/nested': { default: Page } });
		const route = createRouteData({ route: '/nested' });

		const result = await renderPath({
			prerenderer,
			pathname: '/nested',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(
			result.body.toString().includes('<span class="inner">nested</span>'),
			'nested component should render',
		);
	});

	it('falls back to string pages and ComponentInstance pages in the same prerenderer', async () => {
		const Component = createComponent((_result) => renderTemplate`<p>component page</p>`);
		const prerenderer = createMockPrerenderer({
			'/string': '<p>string page</p>',
			'/component': { default: Component },
		});

		const r1 = await renderPath({
			prerenderer,
			pathname: '/string',
			route: createRouteData({ route: '/string' }),
			options,
			logger: options.logger,
		});
		const r2 = await renderPath({
			prerenderer,
			pathname: '/component',
			route: createRouteData({ route: '/component' }),
			options,
			logger: options.logger,
		});

		assert.ok(r1 !== null);
		assert.ok(r2 !== null);
		assert.ok(r1.body.toString().includes('string page'));
		assert.ok(r2.body.toString().includes('component page'));
	});

	it('throws a descriptive error when a pathname has no registered page', async () => {
		const prerenderer = createMockPrerenderer({ '/registered': '<p>ok</p>' });
		const route = createRouteData({ route: '/not-registered' });

		const err = await renderPath({
			prerenderer,
			pathname: '/not-registered',
			route,
			options,
			logger: options.logger,
		}).catch((e) => e);

		assert.ok(err instanceof Error, 'should throw an Error');
		assert.ok(err.message.includes('/not-registered'), 'error should name the missing pathname');
		assert.ok(err.message.includes('/registered'), 'error should list registered pathnames');
	});
});
