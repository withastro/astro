import type * as vite from 'vite';
import type { AstroConfig, ComponentInstance, Renderer, RouteData, RuntimeMode, SSRElement } from '../../../@types/astro';
import { LogOptions } from '../../logger.js';
import { fileURLToPath } from 'url';
import { getStylesForURL } from './css.js';
import { injectTags } from './html.js';
import { RouteCache } from '../route-cache.js';
import { resolveRenderers } from './renderers.js';
import { errorHandler } from './error.js';
import { getHmrScript } from './hmr.js';
import { render as coreRender } from '../core.js';
import { createModuleScriptElementWithSrcSet } from '../ssr-element.js';

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

export type ComponentPreload = [Renderer[], ComponentInstance];

const svelteStylesRE = /svelte\?svelte&type=style/;

export async function preload({ astroConfig, filePath, viteServer }: SSROptions): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await resolveRenderers(viteServer, astroConfig);
	// Load the module from the Vite SSR Runtime.
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

	return [renderers, mod];
}

/** use Vite to SSR */
export async function render(renderers: Renderer[], mod: ComponentInstance, ssrOpts: SSROptions): Promise<string> {
	const { astroConfig, filePath, logging, mode, origin, pathname, route, routeCache, viteServer } = ssrOpts;
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
		// Resolves specifiers in the inline hydrated scripts, such as "@astrojs/renderer-preact/client.js"
		async resolve(s: string) {
			// The legacy build needs these to remain unresolved so that vite HTML
			// Can do the resolution. Without this condition the build output will be
			// broken in the legacy build. This can be removed once the legacy build is removed.
			if (!astroConfig.buildOptions.legacyBuild) {
				const [, resolvedPath] = await viteServer.moduleGraph.resolveUrl(s);
				return resolvedPath;
			} else {
				return s;
			}
		},
		renderers,
		route,
		routeCache,
		site: astroConfig.buildOptions.site,
	});

	if (route?.type === 'endpoint') {
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
	content = injectTags(content, tags);

	// run transformIndexHtml() in dev to run Vite dev transformations
	if (mode === 'development' && astroConfig.buildOptions.legacyBuild) {
		const relativeURL = filePath.href.replace(astroConfig.projectRoot.href, '/');
		content = await viteServer.transformIndexHtml(relativeURL, content, pathname);
	}

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!/<!doctype html/i.test(content)) {
		content = '<!DOCTYPE html>\n' + content;
	}

	return content;
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
