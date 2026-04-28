import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { createRoutesList as _createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import type { StaticBuildOptions } from '../../../dist/core/build/types.js';
import type { Pipeline } from '../../../dist/core/base-pipeline.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import type { AstroInlineConfig } from '../../../dist/types/public/config.js';
import type { ComponentInstance } from '../../../dist/types/astro.js';
import {
	createBasicPipeline,
	createBasicSettings,
	defaultLogger,
	renderThroughMiddleware,
} from '../test-utils.ts';

export function createSettings({
	buildOutput,
	preserveBuildClientDir = false,
	outDir = new URL('file:///project/dist/'),
	clientDir = new URL('file:///project/dist/client/'),
	buildFormat = 'directory',
}: {
	buildOutput: 'static' | 'server';
	preserveBuildClientDir?: boolean;
	outDir?: URL;
	clientDir?: URL;
	buildFormat?: 'directory' | 'file' | 'preserve';
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
 */
export function virtualAstroModules(root: URL, files: Record<string, string>): Plugin {
	const virtualFiles = new Map<string, string>();
	for (const [relativePath, source] of Object.entries(files)) {
		const absolute = fileURLToPath(new URL(relativePath, root));
		virtualFiles.set(absolute, source);
	}

	return {
		name: 'virtual-astro-modules',
		enforce: 'pre',
		resolveId: {
			handler(id: string, importer: string | undefined) {
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
			handler(id: string) {
				if (virtualFiles.has(id)) return { code: virtualFiles.get(id)! };
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
 */
function createTmpRootDir(initialFiles: Record<string, string | Buffer> = {}): URL {
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
 */
export async function createStaticBuildOptions({
	pages = {},
	buildOutput = 'static' as 'static' | 'server',
	adapter = undefined as object | undefined,
	inlineConfig = {} as AstroInlineConfig,
} = {}): Promise<StaticBuildOptions> {
	const hasPages = Object.keys(pages).length > 0;

	// Write page sources to a real temp directory so createRoutesList can scan them.
	// The OS cleans up tmpdir on reboot; no explicit cleanup needed.
	const rootUrl = hasPages
		? createTmpRootDir(pages)
		: pathToFileURL(mkdtempSync(join(tmpdir(), 'astro-test-')) + '/');

	const resolvedConfig = {
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
	};

	let routesList: { routes: RouteData[] } = { routes: [] };
	if (hasPages) {
		const settings = await createBasicSettings({
			root: fileURLToPath(rootUrl),
			srcDir: fileURLToPath(new URL('src/', rootUrl)),
			...inlineConfig,
		});
		routesList = await _createRoutesList({ settings }, defaultLogger);
	}

	const options = {
		origin: 'http://localhost:4321',
		pageNames: [],
		routesList,
		settings: {
			buildOutput,
			adapter,
			config: resolvedConfig,
		},
		logger: { info() {}, warn() {}, error() {}, debug() {} },
	} as unknown as StaticBuildOptions;

	return options;
}

/** Page value: raw HTML string, string factory, a Response, or a ComponentInstance with optional props. */
type PageValue =
	| string
	| (() => string)
	| Response
	| (ComponentInstance & { props?: Record<string, unknown> });

/** Minimal shape matching `AstroPrerenderer` from the public integrations API. */
interface MockPrerenderer {
	name: string;
	getStaticPaths: () => Promise<{ pathname: string; route: RouteData }[]>;
	render: (request: Request, options: { routeData: RouteData }) => Promise<Response>;
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
 * ```ts
 * const prerenderer = createMockPrerenderer({
 *   '/about': '<html><body>About</body></html>',
 *   '/old': new Response(null, { status: 301, headers: { location: '/new' } }),
 * });
 * ```
 */
export function createMockPrerenderer(
	pages: Record<string, PageValue>,
	options: { staticPaths?: { pathname: string; route: RouteData }[] } = {},
): MockPrerenderer {
	const { staticPaths } = options;

	/** Lazily-created shared pipeline — one per prerenderer instance. */
	let _pipeline: Pipeline | null = null;

	function getPipeline(): Pipeline {
		if (!_pipeline) _pipeline = createBasicPipeline();
		return _pipeline;
	}

	return {
		name: 'mock-prerenderer',

		async getStaticPaths() {
			return staticPaths ?? [];
		},

		async render(request: Request, { routeData }: { routeData: RouteData }) {
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
			const { props = {}, ...componentInstance } = page as ComponentInstance & {
				props?: Record<string, unknown>;
			};
			const state = new FetchState(getPipeline(), request);
			state.routeData = routeData as any;
			state.pathname = pathname;
			state.initialProps = props;
			return renderThroughMiddleware(state, componentInstance);
		},
	};
}
