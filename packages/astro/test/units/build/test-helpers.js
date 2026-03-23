// @ts-check
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create as createVfs } from '@platformatic/vfs';
import { prependForwardSlash, removeLeadingForwardSlash } from '../../../dist/core/path.js';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createRoutesList as _createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { createBasicPipeline, createBasicSettings, defaultLogger } from '../test-utils.js';

// The virtual project root used by all helpers. All page paths in `pages`
// records use this as their prefix (e.g. '/project/src/pages/index.astro').
const VIRTUAL_ROOT = '/project';
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
 * Creates an in-memory filesystem backed by `@platformatic/vfs` and mounts it
 * at `VIRTUAL_ROOT` (`/project`).
 *
 * **Path convention**: keys in `initialFiles` are paths relative to the project
 * root — i.e. they start with `src/`, `public/`, `dist/`, etc., **without** a
 * leading `/project/` prefix. The VFS stores files relative to its mount point,
 * so this maps directly:
 *
 * ```js
 * createMemFs({
 *   'src/pages/index.astro': '---\n---\n<h1>Home</h1>',
 *   'public/favicon.ico': '<binary>',
 * });
 * // node:fs will see these at /project/src/pages/index.astro etc.
 * ```
 *
 * The returned VFS supports `Symbol.dispose` for automatic unmounting:
 *
 * ```js
 * {
 *   using vfs = createMemFs({ 'src/pages/index.astro': '...' });
 *   // node:fs transparently serves /project/src/pages/index.astro
 * }
 * // automatically unmounted here
 * ```
 *
 * @param {Record<string, string | Buffer>} [initialFiles]
 *   Map of project-relative paths → file contents (e.g. `'src/pages/index.astro'`).
 * @returns {import('@platformatic/vfs').VirtualFileSystem}
 */
export function createMemFs(initialFiles = {}) {
	// overlay: true — only paths that exist in the VFS are intercepted;
	// real filesystem paths fall through unchanged.
	const vfs = createVfs(undefined, { overlay: true });

	for (const [filePath, content] of Object.entries(initialFiles)) {
		if (filePath.startsWith(VIRTUAL_ROOT)) {
			throw new Error(
				`createMemFs: paths must be project-relative (e.g. 'src/pages/index.astro'), ` +
					`not prefixed with '${VIRTUAL_ROOT}'. Got: '${filePath}'`,
			);
		}
		// Files are written at provider-relative paths (e.g. '/src/pages/index.astro').
		// When the VFS is mounted at VIRTUAL_ROOT (/project), #toProviderPath strips
		// the mount prefix so node:fs sees /project/src/pages/index.astro and the
		// provider lookup finds /src/pages/index.astro — a consistent match.
		const providerPath = prependForwardSlash(removeLeadingForwardSlash(filePath));
		const dir = posix.dirname(providerPath);
		if (dir !== '/') vfs.mkdirSync(dir, { recursive: true });
		vfs.writeFileSync(providerPath, content);
	}

	vfs.mount(VIRTUAL_ROOT);
	return vfs;
}

/**
 * Creates a minimal `StaticBuildOptions` object suitable for passing to
 * `renderPath()` and `generatePages()` in unit tests.
 *
 * When `pages` is provided, the files are written into `fsMod` and the VFS is
 * mounted so that `createRoutesList` (which uses `node:fs` internally) picks
 * them up transparently. `routesList` is then derived by scanning them with the
 * same config, so routes and `settings.config` are always in sync.
 *
 * @param {object} [overrides]
 * @param {import('@platformatic/vfs').VirtualFileSystem} overrides.vfs
 *   An in-memory VFS created with `createMemFs()`. The VFS must already be
 *   mounted — `createMemFs()` does this automatically.
 * @param {'static' | 'server'} [overrides.buildOutput]
 * @param {object | undefined} [overrides.adapter]
 * @param {any} [overrides.inlineConfig]
 *   Astro inline config overrides (e.g. `i18n`, `base`, `trailingSlash`).
 *   Passed to `createBasicSettings` when scanning routes, and merged into
 *   `settings.config` for the returned options object.
 * @returns {Promise<import('../../../dist/core/build/types.js').StaticBuildOptions>}
 */
export async function createStaticBuildOptions({
	vfs,
	buildOutput = /** @type {'static'} */ ('static'),
	adapter = undefined,
	inlineConfig = {},
} = {}) {
	if (!vfs) {
		throw new Error('createStaticBuildOptions: a vfs created with createMemFs() is required');
	}

	// Build the resolved config first — everything else derives from it.
	const resolvedConfig = /** @type {any} */ ({
		root: new URL(`file://${VIRTUAL_ROOT}/`),
		srcDir: new URL(`file://${VIRTUAL_ROOT}/src/`),
		outDir: new URL(`file://${VIRTUAL_ROOT}/dist/`),
		publicDir: new URL(`file://${VIRTUAL_ROOT}/public/`),
		base: '/',
		site: undefined,
		trailingSlash: 'ignore',
		compressHTML: false,
		...inlineConfig,
		build: {
			format: 'directory',
			redirects: true,
			client: new URL(`file://${VIRTUAL_ROOT}/dist/client/`),
			server: new URL(`file://${VIRTUAL_ROOT}/dist/server/`),
			...(inlineConfig.build ?? {}),
		},
	});

	// Derive routesList by scanning the VFS via the real createRoutesList.
	// Because the VFS is mounted, node:fs calls inside createRoutesList
	// (existsSync, readdirSync, readFile) transparently hit the in-memory store
	// — no fsMod threading required here.
	let routesList = { routes: [] };
	const settings = await createBasicSettings({
		root: `${VIRTUAL_ROOT}/`,
		srcDir: `${VIRTUAL_ROOT}/src/`,
		...inlineConfig,
	});
	routesList = await _createRoutesList({ settings, useVirtualFs: true }, defaultLogger);

	const options = /** @type {any} */ ({
		fsMod: vfs,
		useVirtualFs: true,
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
 * @example Using staticPaths to drive generatePages()
 * ```js
 * // staticPaths tells generatePages() which routes to render.
 * // Each pathname must have a matching entry in the pages map.
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
			// Use routeData.pathname as the canonical key — it is the same value
			// that was returned by getStaticPaths() and registered in the pages map.
			const pathname = routeData.pathname;
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
