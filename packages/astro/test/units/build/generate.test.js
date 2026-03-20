// @ts-check
/**
 * Unit tests for the renderPath() function in src/core/build/generate.ts.
 *
 * These tests exercise the page-generation logic (redirect handling, null-body
 * detection, HTML compression, public-conflict detection, header tracking) WITHOUT
 * running a Vite build. All I/O is intercepted by an in-memory filesystem from
 * @platformatic/vfs.
 *
 * The mock prerenderer (createMockPrerenderer) returns pre-defined Responses so
 * the Astro rendering pipeline is not involved at all.
 */
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { renderPath } from '../../../dist/core/build/generate.js';
import {
	createComponent,
	render as renderTemplate,
	renderComponent,
} from '../../../dist/runtime/server/index.js';
import { createMemFs, createMockPrerenderer, createStaticBuildOptions } from './test-helpers.js';
import { createRouteData } from '../mocks.js';

describe('renderPath()', () => {
	it('returns a Buffer body for a normal HTML page', async () => {
		const html = '<html><body>Hello</body></html>';
		const prerenderer = createMockPrerenderer({ '/': html });
		const route = createRouteData({ route: '/' });
		const opts = await createStaticBuildOptions();

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null, 'expected a result, not null');
		assert.ok(result.body instanceof Buffer, 'body should be a Buffer');
		assert.equal(result.body.toString(), html);
	});

	it('returns null when the response has no body', async () => {
		const prerenderer = createMockPrerenderer({
			'/empty': new Response(null, { status: 200 }),
		});
		const route = createRouteData({ route: '/empty' });
		const opts = await createStaticBuildOptions();

		const result = await renderPath({
			prerenderer,
			pathname: '/empty',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.equal(result, null, 'empty body should yield null');
	});

	it('produces a redirect HTML body for a 301 response', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, {
				status: 301,
				headers: { location: '/new' },
			}),
		});
		const route = createRouteData({ route: '/old', type: 'page' });
		const opts = await createStaticBuildOptions({ inlineConfig: { build: { redirects: true } } });

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null, 'redirect should produce a result');
		assert.ok(typeof result.body === 'string', 'redirect body should be a string');
		assert.ok(result.body.includes('/new'), 'redirect body should contain target path');
	});

	it('returns null for redirect routes when config.build.redirects is false', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, {
				status: 301,
				headers: { location: '/new' },
			}),
		});
		// type: 'redirect' + redirects: false → should be suppressed
		const route = createRouteData({ route: '/old', type: 'redirect' });
		const opts = await createStaticBuildOptions({ inlineConfig: { build: { redirects: false } } });

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.equal(
			result,
			null,
			'redirect should be suppressed when config.build.redirects is false',
		);
	});

	it('strips newlines from redirect body when compressHTML is true', async () => {
		const prerenderer = createMockPrerenderer({
			'/old': new Response(null, {
				status: 301,
				headers: { location: '/new' },
			}),
		});
		const route = createRouteData({ route: '/old', type: 'page' });
		const opts = await createStaticBuildOptions({
			inlineConfig: { compressHTML: true, build: { redirects: true } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/old',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null);
		assert.ok(typeof result.body === 'string');
		assert.ok(!result.body.includes('\n'), 'newlines should be stripped when compressHTML is true');
	});

	it('populates routeToHeaders when adapter requests static headers', async () => {
		const html = '<html><body>Page with header</body></html>';
		const prerenderer = createMockPrerenderer({ '/page': html });
		const route = createRouteData({ route: '/page' });
		const routeToHeaders = new Map();
		const opts = await createStaticBuildOptions({
			adapter: { adapterFeatures: { staticHeaders: true } },
		});

		const result = await renderPath({
			prerenderer,
			pathname: '/page',
			route,
			options: opts,
			routeToHeaders,
			logger: opts.logger,
		});

		assert.ok(result !== null);
		assert.ok(routeToHeaders.has('/page'), 'routeToHeaders should be populated for /page');
	});

	it('does NOT populate routeToHeaders when adapter does not request static headers', async () => {
		const html = '<html><body>Page</body></html>';
		const prerenderer = createMockPrerenderer({ '/page': html });
		const route = createRouteData({ route: '/page' });
		const routeToHeaders = new Map();
		const opts = await createStaticBuildOptions({ adapter: undefined });

		await renderPath({
			prerenderer,
			pathname: '/page',
			route,
			options: opts,
			routeToHeaders,
			logger: opts.logger,
		});

		assert.equal(routeToHeaders.size, 0, 'routeToHeaders should remain empty');
	});

	it('returns null and warns when a public file conflicts with the output path', async () => {
		const html = '<html><body>Index</body></html>';
		const prerenderer = createMockPrerenderer({ '/': html });
		const route = createRouteData({ route: '/' });

		// Pre-populate the VFS with a public file at the conflicting path
		// outDir=/project/dist/, public=/project/public/, outFile=dist/index.html
		// The relative path from outDir to the output file is 'index.html'
		// → public conflict is at /project/public/index.html
		const vfs = createMemFs({
			'/project/public/index.html': '<html>public file</html>',
		});
		const opts = await createStaticBuildOptions({ fsMod: vfs });

		const warnings = [];
		opts.logger.warn = (_label, msg) => warnings.push(msg);

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.equal(result, null, 'public conflict should yield null');
		assert.equal(warnings.length, 1);
		assert.equal(
			warnings[0],
			'Skipping src/pages/index.astro because a file with the same name exists in the public folder: index.html',
		);
	});

	it('propagates renderer errors', async () => {
		const prerenderer = createMockPrerenderer({});
		prerenderer.render = async () => {
			throw new Error('render exploded');
		};
		const route = createRouteData({ route: '/boom' });
		const opts = await createStaticBuildOptions();

		const errors = [];
		opts.logger.error = (_label, msg) => errors.push(msg);

		await assert.rejects(
			() =>
				renderPath({ prerenderer, pathname: '/boom', route, options: opts, logger: opts.logger }),
			/render exploded/,
		);
		assert.ok(errors.length > 0, 'error should be logged before re-throwing');
	});

	it('writes the rendered body to the in-memory filesystem via generatePathWithPrerenderer (integration smoke)', async () => {
		// This is a shallow integration test: we call generatePages indirectly by
		// verifying that renderPath + the write layer together place a file in the VFS.
		// We do NOT run a Vite build — just verify the two-step render→write pipeline.
		const html = '<html><body>Written to VFS</body></html>';
		const prerenderer = createMockPrerenderer({ '/vfs-test': html });
		const route = createRouteData({ route: '/vfs-test' });
		const vfs = createMemFs();
		const opts = await createStaticBuildOptions({ fsMod: vfs });

		const result = await renderPath({
			prerenderer,
			pathname: '/vfs-test',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null);

		// Simulate what generatePathWithPrerenderer does after renderPath returns.
		// @platformatic/vfs requires string paths (not URL objects), mirroring the
		// fileURLToPath() calls in generatePathWithPrerenderer itself.
		const outFolderPath = fileURLToPath(result.outFolder);
		const outFilePath = fileURLToPath(result.outFile);
		await vfs.promises.mkdir(outFolderPath, { recursive: true });
		await vfs.promises.writeFile(outFilePath, /** @type {Buffer} */ (result.body));

		// Verify the file landed in the VFS
		assert.ok(vfs.existsSync(outFilePath), `expected ${outFilePath} to exist in VFS`);
		const content = vfs.readFileSync(outFilePath, 'utf-8');
		assert.equal(content, html);
	});
});

// ---------------------------------------------------------------------------
// ComponentInstance rendering via createMockPrerenderer
// ---------------------------------------------------------------------------

describe('createMockPrerenderer with ComponentInstance', () => {
	it('renders a bare ComponentInstance to HTML via RenderContext', async () => {
		// Define a simple page component using the compiled-form API
		const Page = createComponent((_result) => renderTemplate`<h1>Hello from component</h1>`);
		const PageModule = { default: Page };

		const prerenderer = createMockPrerenderer({ '/': PageModule });
		const route = createRouteData({ route: '/' });
		const opts = await createStaticBuildOptions();

		const result = await renderPath({
			prerenderer,
			pathname: '/',
			route,
			options: opts,
			logger: opts.logger,
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
		const opts = await createStaticBuildOptions();

		const result = await renderPath({
			prerenderer,
			pathname: '/blog/hello',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null);
		const html = result.body.toString();
		assert.ok(html.includes('Hello World'), 'props should be forwarded to the component');
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
		const opts = await createStaticBuildOptions();

		const result = await renderPath({
			prerenderer,
			pathname: '/nested',
			route,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(result !== null);
		const html = result.body.toString();
		assert.ok(html.includes('<span class="inner">nested</span>'), 'nested component should render');
	});

	it('falls back to string pages and ComponentInstance pages in the same prerenderer', async () => {
		const Component = createComponent((_result) => renderTemplate`<p>component page</p>`);

		const prerenderer = createMockPrerenderer({
			'/string': '<p>string page</p>',
			'/component': { default: Component },
		});

		const routeString = createRouteData({ route: '/string' });
		const routeComponent = createRouteData({ route: '/component' });
		const opts = await createStaticBuildOptions();

		const r1 = await renderPath({
			prerenderer,
			pathname: '/string',
			route: routeString,
			options: opts,
			logger: opts.logger,
		});
		const r2 = await renderPath({
			prerenderer,
			pathname: '/component',
			route: routeComponent,
			options: opts,
			logger: opts.logger,
		});

		assert.ok(r1 !== null);
		assert.ok(r2 !== null);
		assert.ok(r1.body.toString().includes('string page'));
		assert.ok(r2.body.toString().includes('component page'));
	});

	it('throws a descriptive error when a pathname has no registered page', async () => {
		const prerenderer = createMockPrerenderer({ '/registered': '<p>ok</p>' });
		const route = createRouteData({ route: '/not-registered' });
		const opts = await createStaticBuildOptions();

		const err = await renderPath({
			prerenderer,
			pathname: '/not-registered',
			route,
			options: opts,
			logger: opts.logger,
		}).catch((e) => e);

		assert.ok(err instanceof Error, 'should throw an Error');
		assert.ok(err.message.includes('/not-registered'), 'error should name the missing pathname');
		assert.ok(err.message.includes('/registered'), 'error should list registered pathnames');
	});
});
