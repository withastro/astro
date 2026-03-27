import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import type { StaticBuildOptions } from '../../../dist/core/build/types.js';
import type { RoutesList } from '../../../dist/types/astro.js';
import type { Pipeline } from '../../../dist/core/render/index.js';
import type { AstroPrerenderer, PathWithRoute } from '../../../dist/types/public/integrations.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { RenderContext } from '../../../dist/core/render-context.js';
import { createRoutesList as _createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { createBasicPipeline, createBasicSettings, defaultLogger } from '../test-utils.js';

export function createSettings({
	buildOutput,
	preserveBuildClientDir = false,
	outDir = new URL('file:///project/dist/'),
	clientDir = new URL('file:///project/dist/client/'),
	buildFormat = 'directory' as 'directory' | 'file' | 'preserve',
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

function createTmpRootDir(initialFiles: Record<string, string | Buffer> = {}): URL {
	const rootPath = mkdtempSync(join(tmpdir(), 'astro-test-'));
	for (const [relativePath, content] of Object.entries(initialFiles)) {
		const absPath = join(rootPath, relativePath);
		mkdirSync(join(absPath, '..'), { recursive: true });
		writeFileSync(absPath, content);
	}
	return pathToFileURL(rootPath + '/');
}

export async function createStaticBuildOptions({
	pages = {},
	buildOutput = 'static' as 'static' | 'server',
	adapter = undefined as object | undefined,
	inlineConfig = {} as Record<string, unknown>,
} = {}): Promise<StaticBuildOptions> {
	const hasPages = Object.keys(pages).length > 0;

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
			...((inlineConfig.build as object | undefined) ?? {}),
		},
	};

	let routesList: RoutesList = { routes: [] };
	if (hasPages) {
		const settings = await createBasicSettings({
			root: fileURLToPath(rootUrl),
			srcDir: fileURLToPath(new URL('src/', rootUrl)),
			...(inlineConfig as any),
		});
		routesList = await _createRoutesList({ settings }, defaultLogger);
	}

	return {
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
}

type PageDefinition =
	| string
	| (() => string)
	| Response
	| ({ props?: Record<string, unknown> } & { default: unknown });

export function createMockPrerenderer(
	pages: Record<string, PageDefinition>,
	options: { staticPaths?: PathWithRoute[] } = {},
): AstroPrerenderer {
	const { staticPaths } = options;

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

			if (page instanceof Response) {
				return page;
			}

			if (typeof page === 'string' || typeof page === 'function') {
				const html = typeof page === 'function' ? page() : page;
				return new Response(html, {
					status: 200,
					headers: { 'content-type': 'text/html; charset=utf-8' },
				});
			}

			const { props = {}, ...componentInstance } = page as any;
			const ctx = await RenderContext.create({
				pipeline: getPipeline(),
				request,
				routeData,
				pathname,
				props,
				clientAddress: '127.0.0.1',
			});
			return ctx.render(componentInstance);
		},
	};
}
