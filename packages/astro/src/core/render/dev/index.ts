import { fileURLToPath } from 'url';
import type * as vite from 'vite';
import type { AstroConfig, AstroRenderer, ComponentInstance, RouteData, RuntimeMode, SSRElement, SSRLoadedRenderer } from '../../../@types/astro';
import { LogOptions } from '../../logger.js';
import { render as coreRender } from '../core.js';
import { prependForwardSlash } from '../../../core/path.js';
import { RouteCache } from '../route-cache.js';
import { createModuleScriptElementWithSrcSet } from '../ssr-element.js';
import { getStylesForURL } from './css.js';
import { errorHandler } from './error.js';
import { getHmrScript } from './hmr.js';
import { injectTags } from './html.js';
export interface SSROptions {
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
	/** Method */
	method: string;
	/** Headers */
	headers: Headers;
}

export type ComponentPreload = [SSRLoadedRenderer[], ComponentInstance];

export type RenderResponse = { type: 'html'; html: string } | { type: 'response'; response: Response };

const svelteStylesRE = /svelte\?svelte&type=style/;
// Cache renderers to avoid re-resolving the module using Vite's `ssrLoadModule`
// This prevents an odd exception trying to resolve the same server-side module
// Multiple times. See `isSelfAccepting` issue: https://github.com/withastro/astro/pull/2852
const rendererCache = new Map<string, SSRLoadedRenderer['ssr']>();

async function loadRenderer(viteServer: vite.ViteDevServer, renderer: AstroRenderer): Promise<SSRLoadedRenderer> {
	const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(renderer.serverEntrypoint);

	const cachedRenderer = rendererCache.get(url);
	if (cachedRenderer) {
		return { ...renderer, ssr: cachedRenderer };
	}

	const mod = (await viteServer.ssrLoadModule(url)) as { default: SSRLoadedRenderer['ssr'] };
	rendererCache.set(url, mod.default);
	return { ...renderer, ssr: mod.default };
}

export async function loadRenderers(viteServer: vite.ViteDevServer, astroConfig: AstroConfig): Promise<SSRLoadedRenderer[]> {
	return Promise.all(astroConfig._ctx.renderers.map((r) => loadRenderer(viteServer, r)));
}

export async function preload({ astroConfig, filePath, viteServer }: Pick<SSROptions, 'astroConfig' | 'filePath' | 'viteServer'>): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(viteServer, astroConfig);
	// Load the module from the Vite SSR Runtime.
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

	return [renderers, mod];
}

/** use Vite to SSR */
export async function render(renderers: SSRLoadedRenderer[], mod: ComponentInstance, ssrOpts: SSROptions): Promise<RenderResponse> {
	const { astroConfig, filePath, logging, mode, origin, pathname, method, headers, route, routeCache, viteServer } = ssrOpts;
	const legacy = astroConfig.buildOptions.legacyBuild;

	// Add hoisted script tags
	const scripts = createModuleScriptElementWithSrcSet(!legacy && mod.hasOwnProperty('$$metadata') ? Array.from(mod.$$metadata.hoistedScriptPaths()) : []);

	// Inject HMR scripts
	if (mod.hasOwnProperty('$$metadata') && mode === 'development' && !legacy) {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: { type: 'module', src: new URL('../../../runtime/client/hmr.js', import.meta.url).pathname },
			children: '',
		});
	}
	// TODO: We should allow adding generic HTML elements to the head, not just scripts
	for (const script of astroConfig._ctx.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		}
	}

	// Pass framework CSS in as link tags to be appended to the page.
	let links = new Set<SSRElement>();
	if (!legacy) {
		[...getStylesForURL(filePath, viteServer)].forEach((href) => {
			if (mode === 'development' && svelteStylesRE.test(href)) {
				scripts.add({
					props: { type: 'module', src: href },
					children: '',
				});
			} else {
				links.add({
					props: {
						rel: 'stylesheet',
						href,
						'data-astro-injected': true,
					},
					children: '',
				});
			}
		});
	}

	let content = await coreRender({
		legacyBuild: astroConfig.buildOptions.legacyBuild,
		links,
		logging,
		markdownRender: astroConfig.markdownOptions.render,
		mod,
		origin,
		pathname,
		scripts,
		// Resolves specifiers in the inline hydrated scripts, such as "@astrojs/preact/client.js"
		// TODO: Can we pass the hydration code more directly through Vite, so that we
		// don't need to copy-paste and maintain Vite's import resolution here?
		async resolve(s: string) {
			// The legacy build needs these to remain unresolved so that vite HTML
			// Can do the resolution. Without this condition the build output will be
			// broken in the legacy build. This can be removed once the legacy build is removed.
			if (!astroConfig.buildOptions.legacyBuild) {
				const [resolvedUrl, resolvedPath] = await viteServer.moduleGraph.resolveUrl(s);
				if (resolvedPath.includes('node_modules/.vite')) {
					return resolvedPath.replace(/.*?node_modules\/\.vite/, '/node_modules/.vite');
				}
				// NOTE: This matches the same logic that Vite uses to add the `/@id/` prefix.
				if (!resolvedUrl.startsWith('.') && !resolvedUrl.startsWith('/')) {
					return '/@id' + prependForwardSlash(resolvedUrl);
				}
				return '/@fs' + prependForwardSlash(resolvedPath);
			} else {
				return s;
			}
		},
		renderers,
		route,
		routeCache,
		site: astroConfig.buildOptions.site,
		ssr: astroConfig.buildOptions.experimentalSsr,
		method,
		headers,
	});

	if (route?.type === 'endpoint' || content.type === 'response') {
		return content;
	}

	// inject tags
	const tags: vite.HtmlTagDescriptor[] = [];

	// dev only: inject Astro HMR client
	if (mode === 'development' && legacy) {
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
	if (legacy) {
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
	}

	// add injected tags
	let html = injectTags(content.html, tags);

	// run transformIndexHtml() in dev to run Vite dev transformations
	if (mode === 'development' && astroConfig.buildOptions.legacyBuild) {
		const relativeURL = filePath.href.replace(astroConfig.projectRoot.href, '/');
		html = await viteServer.transformIndexHtml(relativeURL, html, pathname);
	}

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + content;
	}

	return {
		type: 'html',
		html,
	};
}

export async function ssr(preloadedComponent: ComponentPreload, ssrOpts: SSROptions): Promise<RenderResponse> {
	try {
		const [renderers, mod] = preloadedComponent;
		return await render(renderers, mod, ssrOpts); // note(drew): without "await", errors won’t get caught by errorHandler()
	} catch (e: unknown) {
		await errorHandler(e, { viteServer: ssrOpts.viteServer, filePath: ssrOpts.filePath });
		throw e;
	}
}
