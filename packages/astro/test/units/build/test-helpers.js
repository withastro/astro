// @ts-check
import { fileURLToPath } from 'node:url';
import { create as createVfs } from '@platformatic/vfs';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createRoutesList as _createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { createBasicSettings, defaultLogger } from '../test-utils.js';
import { createBasicPipeline } from '../test-utils.js';

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
			build: {
				client: clientDir,
				format: buildFormat,
			},
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
				// Handle absolute paths (used by server island manifest dynamic imports)
				if (virtualFiles.has(id)) {
					return id;
				}
				// Handle bare paths like "/src/pages/index.astro"
				if (id.startsWith('/')) {
					const absolute = fileURLToPath(new URL('.' + id, root));
					if (virtualFiles.has(absolute)) {
						return absolute;
					}
				}
				// Handle relative imports from within virtual files
				if (importer && virtualFiles.has(importer) && id.startsWith('.')) {
					const resolved = fileURLToPath(new URL(id, 'file://' + importer));
					if (virtualFiles.has(resolved)) {
						return resolved;
					}
				}
			},
		},
		load: {
			handler(id) {
				if (virtualFiles.has(id)) {
					return { code: virtualFiles.get(id) };
				}
			},
		},
	};
}

/**
 * Creates an in-memory filesystem backed by `@platformatic/vfs`.
 *
 * ```js
 * const vfs = createMemFs();
 * await generatePages({ ...opts, fsMod: vfs }, internals, prerenderOutputDir);
 * const html = vfs.readFileSync('/path/to/dist/index.html', 'utf-8');
 * ```
 *
 * @param {Record<string, string | Buffer>} [initialFiles]
 *   Optional map of absolute paths → file contents to pre-populate the VFS.
 * @returns {import('@platformatic/vfs').VirtualFileSystem}
 */
export function createMemFs(initialFiles = {}) {
	const vfs = createVfs();
	for (const [filePath, content] of Object.entries(initialFiles)) {
		const dir = filePath.slice(0, filePath.lastIndexOf('/'));
		if (dir) vfs.mkdirSync(dir, { recursive: true });
		vfs.writeFileSync(filePath, content);
	}
	return vfs;
}

/**
 * Creates a minimal `StaticBuildOptions` object suitable for passing to
 * `renderPath()` and `generatePages()` in unit tests.
 *
 * When `pages` is provided, the VFS is populated with those files and
 * `createRoutesList` is called using the same `fsMod` and `inlineConfig` so
 * that `routesList` and `settings.config` are always in sync.
 *
 * @param {object} [overrides]
 * @param {import('@platformatic/vfs').VirtualFileSystem} [overrides.fsMod]
 *   In-memory filesystem. Defaults to a fresh `createMemFs()` instance.
 * @param {Record<string, string>} [overrides.pages]
 *   Optional map of absolute VFS paths to `.astro` source content.
 *   When provided, the files are written into `fsMod` and `routesList` is
 *   derived by scanning them — no manual `createRouteData` calls needed.
 * @param {'static' | 'server'} [overrides.buildOutput]
 * @param {object | undefined} [overrides.adapter]
 * @param {any} [overrides.inlineConfig]
 *   Astro inline config overrides (e.g. `i18n`, `base`, `trailingSlash`).
 *   Passed to `createBasicSettings` when `pages` is provided, and merged into
 *   `settings.config` for the returned options object.
 * @returns {Promise<import('../../../dist/core/build/types.js').StaticBuildOptions>}
 */
export async function createStaticBuildOptions({
	fsMod = createMemFs(),
	pages = {},
	buildOutput = /** @type {'static'} */ ('static'),
	adapter = undefined,
	inlineConfig = {},
} = {}) {
	// Build the resolved config first — everything else derives from it.
	const resolvedConfig = /** @type {any} */ ({
		root: new URL('file:///project/'),
		srcDir: new URL('file:///project/src/'),
		outDir: new URL('file:///project/dist/'),
		publicDir: new URL('file:///project/public/'),
		base: '/',
		site: undefined,
		trailingSlash: 'ignore',
		compressHTML: false,
		...inlineConfig,
		build: {
			format: 'directory',
			redirects: true,
			client: new URL('file:///project/dist/client/'),
			server: new URL('file:///project/dist/server/'),
			...(inlineConfig.build ?? {}),
		},
	});

	// Write page sources into the shared VFS
	for (const [filePath, content] of Object.entries(pages)) {
		const dir = filePath.slice(0, filePath.lastIndexOf('/'));
		if (dir) fsMod.mkdirSync(dir, { recursive: true });
		fsMod.writeFileSync(filePath, content);
	}

	// Derive routesList from the same fsMod and inlineConfig so they are always in sync.
	// createBasicSettings receives the raw inlineConfig (string paths, user-facing shape)
	// anchored to the same root/srcDir as resolvedConfig, so the manifest builder sees a
	// configuration consistent with what renderPath() will use at runtime.
	let routesList = { routes: [] };
	if (Object.keys(pages).length > 0) {
		const settings = await createBasicSettings({
			root: '/project/',
			srcDir: '/project/src/',
			...inlineConfig,
		});
		routesList = await _createRoutesList({ settings, fsMod }, defaultLogger);
	}

	return /** @type {any} */ ({
		fsMod,
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
}

/**
 * Creates a minimal `AstroPrerenderer` backed by an in-memory map of pathnames
 * to page definitions.
 *
 * This lets you test `renderPath()` and `generatePages()` logic **without a
 * Vite build**.  Each page value can be:
 *
 * - A raw HTML **string**
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
 * When omitted, `getStaticPaths()` returns `[]` and nothing will be generated
 * unless you call `renderPath()` directly in your test.
 *
 * @example Basic usage
 * ```js
 * import { createComponent, render } from '../../../dist/runtime/server/index.js';
 *
 * const Home = createComponent((_r, { title }) => render`<h1>${title}</h1>`);
 *
 * const prerenderer = createMockPrerenderer({
 *   // Raw HTML string
 *   '/about': '<html><body>About</body></html>',
 *
 *   // ComponentInstance (no props)
 *   '/': { default: Home },
 *
 *   // ComponentInstance + props — same shape, just add a `props` key
 *   '/home': { default: Home, props: { title: 'Welcome' } },
 *
 *   // Explicit Response (redirect)
 *   '/old': new Response(null, { status: 301, headers: { location: '/new' } }),
 * });
 * ```
 *
 * @example
 * Using staticPaths to drive generatePages(). `staticPaths` tells generatePages() which routes to render.
 * Each pathname must have a matching entry in the pages map.
 *
 * ```js
 * const prerenderer = createMockPrerenderer(
 *   {
 *     '/blog/a': '<html><body>Post A</body></html>',
 *     '/blog/b': '<html><body>Post B</body></html>',
 *   },
 *   {
 *     staticPaths: [
 *       { pathname: '/blog/a', route: createRouteData({ route: '/blog/a' }) },
 *       { pathname: '/blog/b', route: createRouteData({ route: '/blog/b' }) },
 *     ],
 *   },
 * );
 *
 * // generatePages() calls getStaticPaths() internally, so both pages will be rendered.
 * const vfs = createMemFs();
 * await generatePages({ ...opts, fsMod: vfs }, prerenderer);
 * assert.ok(vfs.existsSync('/project/dist/blog/a/index.html'));
 * assert.ok(vfs.existsSync('/project/dist/blog/b/index.html'));
 * ```
 *
 * @param {Record<string, string | (() => string) | Response | (import('../../../dist/types/astro.js').ComponentInstance & { props?: Record<string, unknown> })>} pages
 * @param {{ staticPaths?: import('../../..').PathWithRoute[] }} [options]
 * @returns {import('../../..').AstroPrerenderer}
 */
export function createMockPrerenderer(pages, { staticPaths } = {}) {
	let pipeline = createBasicPipeline();

	return {
		name: 'mock-prerenderer',

		async getStaticPaths() {
			return staticPaths ?? [];
		},

		async render(request, { routeData, pathname }) {
			const page = pages[pathname];

			if (page === undefined) {
				throw new Error(
					`createMockPrerenderer: no page registered for pathname "${pathname}". ` +
						`Registered pathnames: ${Object.keys(pages).join(', ') || '(none)'}`,
				);
			}

			// redirects, explicit status codes
			if (page instanceof Response) {
				return page;
			}

			// HTML string or string factory
			if (typeof page === 'string' || typeof page === 'function') {
				const html = typeof page === 'function' ? page() : page;
				return new Response(html, {
					status: 200,
					headers: { 'content-type': 'text/html; charset=utf-8' },
				});
			}

			// Everything else is treated as a ComponentInstance and rendered via
			// RenderContext, letting the pipeline handle it naturally.
			const { props = {}, ...componentInstance } = /** @type {any} */ (page);
			const ctx = await RenderContext.create({
				pipeline,
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
