import type { BuildResult } from 'esbuild';
import type vite from '../vite';
import type {
	AstroConfig,
	ComponentInstance,
	GetStaticPathsResult,
	GetStaticPathsResultKeyed,
	Params,
	Props,
	Renderer,
	RouteCache,
	RouteData,
	RuntimeMode,
	SSRElement,
	SSRError,
} from '../../@types/astro';
import type { LogOptions } from '../logger';

import eol from 'eol';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderPage } from '../../runtime/server/index.js';
import { codeFrame, resolveDependency } from '../util.js';
import { getStylesForURL } from './css.js';
import { injectTags } from './html.js';
import { generatePaginateFunction } from './paginate.js';
import { getParams, validateGetStaticPathsModule, validateGetStaticPathsResult } from './routing.js';
import { createResult } from './result.js';
import { assignStaticPaths, ensureRouteCached, findPathItemByKey } from './route-cache.js';

const svelteStylesRE = /svelte\?svelte&type=style/;

interface SSROptions {
	/** an instance of the AstroConfig */
	astroConfig: AstroConfig;
	/** location of file on disk */
	filePath: URL;
	/** logging options */
	logging: LogOptions;
	/** "development" or "production" */
	mode: RuntimeMode;
	/** production website, needed for some RSS & Sitemap functions */
	origin: string;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;
	/** pass in route cache because SSR can’t manage cache-busting */
	routeCache: RouteCache;
	/** Vite instance */
	viteServer: vite.ViteDevServer;
}

const cache = new Map<string, Promise<Renderer>>();

// TODO: improve validation and error handling here.
async function resolveRenderer(viteServer: vite.ViteDevServer, renderer: string, astroConfig: AstroConfig) {
	const resolvedRenderer: any = {};
	// We can dynamically import the renderer by itself because it shouldn't have
	// any non-standard imports, the index is just meta info.
	// The other entrypoints need to be loaded through Vite.
	const {
		default: { name, client, polyfills, hydrationPolyfills, server },
	} = await import(resolveDependency(renderer, astroConfig));

	resolvedRenderer.name = name;
	if (client) resolvedRenderer.source = path.posix.join(renderer, client);
	resolvedRenderer.serverEntry = path.posix.join(renderer, server);
	if (Array.isArray(hydrationPolyfills)) resolvedRenderer.hydrationPolyfills = hydrationPolyfills.map((src: string) => path.posix.join(renderer, src));
	if (Array.isArray(polyfills)) resolvedRenderer.polyfills = polyfills.map((src: string) => path.posix.join(renderer, src));
	const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(resolvedRenderer.serverEntry);
	const { default: rendererSSR } = await viteServer.ssrLoadModule(url);
	resolvedRenderer.ssr = rendererSSR;

	const completedRenderer: Renderer = resolvedRenderer;
	return completedRenderer;
}

async function resolveRenderers(viteServer: vite.ViteDevServer, astroConfig: AstroConfig): Promise<Renderer[]> {
	const ids: string[] = astroConfig.renderers;
	const renderers = await Promise.all(
		ids.map((renderer) => {
			if (cache.has(renderer)) return cache.get(renderer)!;
			let promise = resolveRenderer(viteServer, renderer, astroConfig);
			cache.set(renderer, promise);
			return promise;
		})
	);

	return renderers;
}

interface ErrorHandlerOptions {
	filePath: URL;
	viteServer: vite.ViteDevServer;
}

async function errorHandler(e: unknown, { viteServer, filePath }: ErrorHandlerOptions) {
	// normalize error stack line-endings to \n
	if ((e as any).stack) {
		(e as any).stack = eol.lf((e as any).stack);
	}

	// fix stack trace with Vite (this searches its module graph for matches)
	if (e instanceof Error) {
		viteServer.ssrFixStacktrace(e);
	}

	// Astro error (thrown by esbuild so it needs to be formatted for Vite)
	if (Array.isArray((e as any).errors)) {
		const { location, pluginName, text } = (e as BuildResult).errors[0];
		const err = e as SSRError;
		if (location) err.loc = { file: location.file, line: location.line, column: location.column };
		let src = err.pluginCode;
		if (!src && err.id && fs.existsSync(err.id)) src = await fs.promises.readFile(err.id, 'utf8');
		if (!src) src = await fs.promises.readFile(filePath, 'utf8');
		err.frame = codeFrame(src, err.loc);
		err.id = location?.file;
		err.message = `${location?.file}: ${text}
${err.frame}
`;
		if (pluginName) err.plugin = pluginName;
		throw err;
	}

	// Generic error (probably from Vite, and already formatted)
	throw e;
}

export type ComponentPreload = [Renderer[], ComponentInstance];

export async function preload({ astroConfig, filePath, viteServer }: SSROptions): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await resolveRenderers(viteServer, astroConfig);
	// Load the module from the Vite SSR Runtime.
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

	return [renderers, mod];
}

export async function getParamsAndProps({
	route,
	routeCache,
	logging,
	pathname,
	mod,
	validate = true,
}: {
	route: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	mod: ComponentInstance;
	logging: LogOptions;
	validate?: boolean;
}): Promise<[Params, Props]> {
	// Handle dynamic routes
	let params: Params = {};
	let pageProps: Props;
	if (route && !route.pathname) {
		if (route.params.length) {
			const paramsMatch = route.pattern.exec(pathname);
			if (paramsMatch) {
				params = getParams(route.params)(paramsMatch);
			}
		}
		if (validate) {
			validateGetStaticPathsModule(mod);
		}
		if (!routeCache[route.component]) {
			await assignStaticPaths(routeCache, route, mod);
		}
		if (validate) {
			// This validation is expensive so we only want to do it in dev.
			validateGetStaticPathsResult(routeCache[route.component], logging);
		}
		const staticPaths: GetStaticPathsResultKeyed = routeCache[route.component];
		const paramsKey = JSON.stringify(params);
		const matchedStaticPath = findPathItemByKey(staticPaths, paramsKey, logging);
		if (!matchedStaticPath) {
			throw new Error(`[getStaticPaths] route pattern matched, but no matching static path found. (${pathname})`);
		}
		// This is written this way for performance; instead of spreading the props
		// which is O(n), create a new object that extends props.
		pageProps = Object.create(matchedStaticPath.props || Object.prototype);
	} else {
		pageProps = {};
	}
	return [params, pageProps];
}

/** use Vite to SSR */
export async function render(renderers: Renderer[], mod: ComponentInstance, ssrOpts: SSROptions): Promise<string> {
	const { astroConfig, filePath, logging, mode, origin, pathname, route, routeCache, viteServer } = ssrOpts;

	// Handle dynamic routes
	let params: Params = {};
	let pageProps: Props = {};
	if (route && !route.pathname) {
		if (route.params.length) {
			const paramsMatch = route.pattern.exec(pathname);
			if (paramsMatch) {
				params = getParams(route.params)(paramsMatch);
			}
		}
		validateGetStaticPathsModule(mod);
		await ensureRouteCached(routeCache, route, mod);
		validateGetStaticPathsResult(routeCache[route.component], logging);
		const routePathParams: GetStaticPathsResult = routeCache[route.component];
		const matchedStaticPath = routePathParams.find(({ params: _params }) => JSON.stringify(_params) === JSON.stringify(params));
		if (!matchedStaticPath) {
			throw new Error(`[getStaticPaths] route pattern matched, but no matching static path found. (${pathname})`);
		}
		pageProps = { ...matchedStaticPath.props } || {};
	}

	// Validate the page component before rendering the page
	const Component = await mod.default;
	if (!Component) throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);
	if (!Component.isAstroComponentFactory) throw new Error(`Unable to SSR non-Astro component (${route?.component})`);

	// Add hoisted script tags
	const scripts = astroConfig.buildOptions.experimentalStaticBuild
		? new Set<SSRElement>(
				Array.from(mod.$$metadata.hoistedScriptPaths()).map((src) => ({
					props: { type: 'module', src },
					children: '',
				}))
		  )
		: new Set<SSRElement>();

	const result = createResult({ astroConfig, logging, origin, params, pathname, renderers, scripts });
	// Resolves specifiers in the inline hydrated scripts, such as "@astrojs/renderer-preact/client.js"
	result.resolve = async (s: string) => {
		// The legacy build needs these to remain unresolved so that vite HTML
		// Can do the resolution. Without this condition the build output will be
		// broken in the legacy build. This can be removed once the legacy build is removed.
		if (astroConfig.buildOptions.experimentalStaticBuild) {
			const [, resolvedPath] = await viteServer.moduleGraph.resolveUrl(s);
			return resolvedPath;
		} else {
			return s;
		}
	};

	let html = await renderPage(result, Component, pageProps, null);

	// inject tags
	const tags: vite.HtmlTagDescriptor[] = [];

	// dev only: inject Astro HMR client
	if (mode === 'development') {
		tags.push({
			tag: 'script',
			attrs: { type: 'module' },
			// HACK: inject the direct contents of our `astro/runtime/client/hmr.js` to ensure
			// `import.meta.hot` is properly handled by Vite
			children: await getHmrScript(),
			injectTo: 'head',
		});
	}

	// inject CSS
	[...getStylesForURL(filePath, viteServer)].forEach((href) => {
		if (mode === 'development' && svelteStylesRE.test(href)) {
			tags.push({
				tag: 'script',
				attrs: { type: 'module', src: href },
				injectTo: 'head',
			});
		} else {
			tags.push({
				tag: 'link',
				attrs: {
					rel: 'stylesheet',
					href,
					'data-astro-injected': true,
				},
				injectTo: 'head',
			});
		}
	});

	// add injected tags
	html = injectTags(html, tags);

	// run transformIndexHtml() in dev to run Vite dev transformations
	if (mode === 'development' && !astroConfig.buildOptions.experimentalStaticBuild) {
		const relativeURL = filePath.href.replace(astroConfig.projectRoot.href, '/');
		html = await viteServer.transformIndexHtml(relativeURL, html, pathname);
	}

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}

	return html;
}

let hmrScript: string;
async function getHmrScript() {
	if (hmrScript) return hmrScript;
	const filePath = fileURLToPath(new URL('../../runtime/client/hmr.js', import.meta.url));
	const content = await fs.promises.readFile(filePath);
	hmrScript = content.toString();
	return hmrScript;
}

export async function ssr(ssrOpts: SSROptions): Promise<string> {
	try {
		const [renderers, mod] = await preload(ssrOpts);
		return await render(renderers, mod, ssrOpts); // note(drew): without "await", errors won’t get caught by errorHandler()
	} catch (e: unknown) {
		await errorHandler(e, { viteServer: ssrOpts.viteServer, filePath: ssrOpts.filePath });
		throw e;
	}
}
