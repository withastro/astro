// @ts-check
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createRoutesList as _createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { createBasicPipeline, createBasicSettings, defaultLogger } from '../test-utils.js';

/**
 * @param {object} options
 * @param {'static' | 'server'} options.buildOutput
 * @param {boolean} [options.preserveBuildClientDir]
 * @param {URL} [options.outDir]
 * @param {URL} [options.clientDir]
 * @param {'directory' | 'file' | 'preserve'} [options.buildFormat]
 */
export function createSettings({
	buildOutput,
	preserveBuildClientDir = false,
	outDir = new URL('file:///project/dist/'),
	clientDir = new URL('file:///project/dist/client/'),
	buildFormat = 'directory',
}) {
	return {
		buildOutput,
		adapter: preserveBuildClientDir
			? { adapterFeatures: { preserveBuildClientDir: true } }
			: undefined,
		config: {
			outDir,
			build: { client: clientDir, format: buildFormat },
		},
	};
}

/**
 * A Vite plugin that provides in-memory .astro source files as virtual modules.
 * This allows running a full Astro build without any files on disk.
 *
 * @param {URL} root - The project root URL
 * @param {Record<string, string>} files - Map of relative paths (e.g. 'src/pages/index.astro') to source content
 */
export function virtualAstroModules(root, files) {
	const virtualFiles = new Map();
	for (const [relativePath, source] of Object.entries(files)) {
		const absolute = fileURLToPath(new URL(relativePath, root));
		virtualFiles.set(absolute, source);
	}

	return {
		name: 'virtual-astro-modules',
		enforce: 'pre',
		resolveId: {
			handler(id, importer) {
				if (virtualFiles.has(id)) return id;
				if (id.startsWith('/')) {
					const absolute = fileURLToPath(new URL('.' + id, root));
					if (virtualFiles.has(absolute)) return absolute;
				}
				if (importer && virtualFiles.has(importer) && id.startsWith('.')) {
					const resolved = fileURLToPath(new URL(id, 'file://' + importer));
					if (virtualFiles.has(resolved)) return resolved;
				}
			},
		},
		load: {
			handler(id) {
				if (virtualFiles.has(id)) return { code: virtualFiles.get(id) };
			},
		},
	};
}

/**
 * Creates a temporary directory pre-populated with the given files, and
 * returns its URL alongside a cleanup function.
 *
 * All page paths are project-relative (e.g. `'src/pages/index.astro'`).
 * Call `cleanup()` when done to remove the directory.
 *
 * @param {Record<string, string | Buffer>} [initialFiles]
 * @returns {URL}
 */
function createTmpRootDir(initialFiles = {}) {
	const rootPath = mkdtempSync(join(tmpdir(), 'astro-test-'));
	for (const [relativePath, content] of Object.entries(initialFiles)) {
		const absPath = join(rootPath, relativePath);
		mkdirSync(join(absPath, '..'), { recursive: true });
		writeFileSync(absPath, content);
	}
	return pathToFileURL(rootPath + '/');
}

/**
 * Creates a minimal `StaticBuildOptions` object suitable for passing to
 * `renderPath()` and `generatePages()` in unit tests.
 *
 * When `pages` is provided, the files are written into a real temporary
 * directory, `createRoutesList` scans them, and `cleanup()` removes them when
 * the test is done. Without `pages`, an empty options object is returned
 * (no routes, no disk I/O).
 *
 * @param {object} [overrides]
 * @param {Record<string, string>} [overrides.pages]
 *   Map of project-relative paths (e.g. `'src/pages/index.astro'`) to source
 *   content. Written to a temp directory and scanned to produce `routesList`.
 * @param {'static' | 'server'} [overrides.buildOutput]
 * @param {object | undefined} [overrides.adapter]
 * @param {any} [overrides.inlineConfig]
 *   Astro inline config overrides (e.g. `i18n`, `base`, `trailingSlash`).
 * @returns {Promise<import('../../../dist/core/build/types.js').StaticBuildOptions>}
 */
export async function createStaticBuildOptions({
	pages = {},
	buildOutput = /** @type {'static'} */ ('static'),
	adapter = undefined,
	inlineConfig = {},
} = {}) {
	const hasPages = Object.keys(pages).length > 0;

	// Write page sources to a real temp directory so createRoutesList can scan them.
	// The OS cleans up tmpdir on reboot; no explicit cleanup needed.
	const rootUrl = hasPages
		? createTmpRootDir(pages)
		: pathToFileURL(mkdtempSync(join(tmpdir(), 'astro-test-')) + '/');

	const resolvedConfig = /** @type {any} */ ({
		root: rootUrl,
		srcDir: new URL('src/', rootUrl),
		outDir: new URL('dist/', rootUrl),
		publicDir: new URL('public/', rootUrl),
		base: '/',
		site: undefined,
		trailingSlash: 'ignore',
		compressHTML: false,
		...inlineConfig,
		build: {
			format: 'directory',
			redirects: true,
			client: new URL('dist/client/', rootUrl),
			server: new URL('dist/server/', rootUrl),
			...(inlineConfig.build ?? {}),
		},
	});

	let routesList = { routes: [] };
	if (hasPages) {
		const settings = await createBasicSettings({
			root: fileURLToPath(rootUrl),
			srcDir: fileURLToPath(new URL('src/', rootUrl)),
			...inlineConfig,
		});
		routesList = await _createRoutesList({ settings }, defaultLogger);
	}

	const options = /** @type {any} */ ({
		origin: 'http://localhost:4321',
		pageNames: [],
		routesList,
		settings: {
			buildOutput,
			adapter,
			config: resolvedConfig,
		},
		logger: { info() {}, warn() {}, error() {}, debug() {} },
	});

	return options;
}

/**
 * Creates a minimal `AstroPrerenderer` backed by an in-memory map of pathnames
 * to page definitions.
 *
 * This lets you test `renderPath()` and `generatePages()` logic **without a
 * Vite build**.  Each page value can be:
 *
 * - A raw HTML **string** (or a function returning one) — no rendering pipeline
 *   involved, just wraps in a `200 text/html` Response.
 * - A **`Response`** — returned as-is (useful for redirects, 404s, …).
 * - A **`ComponentInstance`** — an object `{ default: createComponent(…), props? }`.
 *   The helper renders it through `RenderContext` + `createBasicPipeline` so
 *   the full Astro rendering pipeline runs (slots, `maybeRenderHead`, …)
 *   without needing a compiled bundle or Vite.  An optional `props` key on
 *   the same object is forwarded to the component.
 *
 * Rendering a pathname that has no entry throws an error with a descriptive message.
 *
 * ### `staticPaths`
 *
 * The optional `staticPaths` array is returned by `getStaticPaths()` and tells
 * `generatePages()` which routes to render.  Each entry is a `{ pathname, route }`
 * pair — the same shape as `PathWithRoute` in the public integrations API.
 *
 * @example Basic usage
 * ```js
 * const prerenderer = createMockPrerenderer({
 *   '/about': '<html><body>About</body></html>',
 *   '/old': new Response(null, { status: 301, headers: { location: '/new' } }),
 * });
 * ```
 *
 * @param {Record<string, string | (() => string) | Response | (import('../../../dist/types/astro.js').ComponentInstance & { props?: Record<string, unknown> })>} pages
 * @param {{ staticPaths?: import('../../..').PathWithRoute[] }} [options]
 * @returns {import('../../..').AstroPrerenderer}
 */
export function createMockPrerenderer(pages, options = {}) {
	const { staticPaths } = options;

	/** Lazily-created shared pipeline — one per prerenderer instance. */
	let _pipeline = null;

	/** @returns {import('../../../dist/core/base-pipeline.js').Pipeline} */
	function getPipeline() {
		if (!_pipeline) _pipeline = createBasicPipeline();
		return _pipeline;
	}

	return {
		name: 'mock-prerenderer',

		async getStaticPaths() {
			return staticPaths ?? [];
		},

		async render(request, { routeData }) {
			// For static routes routeData.pathname is the canonical key.
			// For dynamic routes (pathname === undefined), derive it from the
			// request URL by stripping build-format artifacts (trailing slash, .html).
			const raw = new URL(request.url).pathname;
			const normalized = raw === '/' ? raw : raw.replace(/\/$/, '').replace(/\.html$/, '');
			const pathname = routeData.pathname ?? normalized;
			const page = pages[pathname];

			if (page === undefined) {
				throw new Error(
					`createMockPrerenderer: no page registered for pathname "${pathname}". ` +
						`Registered pathnames: ${Object.keys(pages).join(', ') || '(none)'}`,
				);
			}

			// ── Pre-built Response (redirects, explicit status codes) ────────
			if (page instanceof Response) {
				return page;
			}

			// ── HTML string or string factory ────────────────────────────────
			if (typeof page === 'string' || typeof page === 'function') {
				const html = typeof page === 'function' ? page() : page;
				return new Response(html, {
					status: 200,
					headers: { 'content-type': 'text/html; charset=utf-8' },
				});
			}

			// ── ComponentInstance: { default: Component, props? } ────────────
			// Everything else is treated as a ComponentInstance and rendered via
			// RenderContext, letting the pipeline handle it naturally.
			const { props = {}, ...componentInstance } = /** @type {any} */ (page);
			const ctx = await RenderContext.create({
				pipeline: getPipeline(),
				request,
				routeData,
				pathname,
				props,
				clientAddress: undefined,
			});
			return ctx.render(componentInstance);
		},
	};
}
