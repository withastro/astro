import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import type {
	AstroSettings,
	ComponentInstance,
	RouteData,
	RuntimeMode,
	SSRElement,
	SSRLoadedRenderer,
} from '../../../@types/astro';
import type { DevelopmentEnvironment } from './environment';
import { PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { LogOptions } from '../../logger/core.js';
import { isPage, resolveIdToUrl } from '../../util.js';
import { renderPage as coreRenderPage, createRenderContext } from '../index.js';
import { RouteCache } from '../route-cache.js';
import { collectMdMetadata } from '../util.js';
import { getStylesForURL } from './css.js';
import { getScriptsForURL } from './scripts.js';
import { loadRenderer, filterFoundRenderers } from '../renderer.js';
export { createDevelopmentEnvironment } from './environment.js';
export type { DevelopmentEnvironment }; 

export interface SSROptionsOld {
	/** an instance of the AstroSettings */
	settings: AstroSettings;
	/** location of file on disk */
	filePath: URL;
	/** logging options */
	logging: LogOptions;
	/** "development" or "production" */
	mode: RuntimeMode;
	/** production website */
	origin: string;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;
	/** pass in route cache because SSR can’t manage cache-busting */
	routeCache: RouteCache;
	/** Vite instance */
	viteServer: ViteDevServer;
	/** Request */
	request: Request;
}

/*
		filePath: options.filePath
	});

	const ctx = createRenderContext({
		request: options.request,
		origin: options.origin,
		pathname: options.pathname,
		scripts,
		links,
		styles,
		route: options.route
		*/

export interface SSROptions {
	/** The environment instance */
	env: DevelopmentEnvironment;
	/** location of file on disk */
	filePath: URL;
	/** production website */
	origin: string;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** The renderers and instance */
	preload: ComponentPreload;
	/** Request */
	request: Request;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;

}

export type ComponentPreload = [SSRLoadedRenderer[], ComponentInstance];

export async function loadRenderers(
	viteServer: ViteDevServer,
	settings: AstroSettings
): Promise<SSRLoadedRenderer[]> {
	const loader = (entry: string) => viteServer.ssrLoadModule(entry);
	const renderers = await Promise.all(settings.renderers.map(r => loadRenderer(r, loader)));
	return filterFoundRenderers(renderers);
}

export async function preload({
	env,
	filePath,
}: Pick<SSROptions, 'env' | 'filePath'>): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(env.viteServer, env.settings);
	// Load the module from the Vite SSR Runtime.
	const mod = (await env.viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
	if (env.viteServer.config.mode === 'development' || !mod?.$$metadata) {
		return [renderers, mod];
	}

	// append all nested markdown metadata to mod.$$metadata
	const modGraph = await env.viteServer.moduleGraph.getModuleByUrl(fileURLToPath(filePath));
	if (modGraph) {
		await collectMdMetadata(mod.$$metadata, modGraph, env.viteServer);
	}

	return [renderers, mod];
}

interface GetScriptsAndStylesParams {
	env: DevelopmentEnvironment;
	filePath: URL;
}

async function getScriptsAndStyles({ env, filePath }: GetScriptsAndStylesParams) {
	// Add hoisted script tags
	const scripts = await getScriptsForURL(filePath, env.viteServer);

	// Inject HMR scripts
	if (isPage(filePath, env.settings) && env.mode === 'development') {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: {
				type: 'module',
				src: await resolveIdToUrl(env.viteServer, 'astro/runtime/client/hmr.js'),
			},
			children: '',
		});
	}

	// TODO: We should allow adding generic HTML elements to the head, not just scripts
	for (const script of env.settings.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		} else if (script.stage === 'page' && isPage(filePath, env.settings)) {
			scripts.add({
				props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
				children: '',
			});
		}
	}

	// Pass framework CSS in as style tags to be appended to the page.
	const { urls: styleUrls, stylesMap } = await getStylesForURL(filePath, env.viteServer, env.mode);
	let links = new Set<SSRElement>();
	[...styleUrls].forEach((href) => {
		links.add({
			props: {
				rel: 'stylesheet',
				href,
			},
			children: '',
		});
	});

	let styles = new Set<SSRElement>();
	[...stylesMap].forEach(([url, content]) => {
		// Vite handles HMR for styles injected as scripts
		scripts.add({
			props: {
				type: 'module',
				src: url,
			},
			children: '',
		});
		// But we still want to inject the styles to avoid FOUC
		styles.add({
			props: {},
			children: content,
		});
	});
	
	return { scripts, styles, links };
}

export async function renderPage(options: SSROptions): Promise<Response> {
	const [renderers, mod] = options.preload;

	// Override the environment's renderers. This ensures that if renderers change (HMR)
	// The new instances are passed through.
	options.env.renderers = renderers;

	const { scripts, links, styles } = await getScriptsAndStyles({
		env: options.env,
		filePath: options.filePath
	});

	const ctx = createRenderContext({
		request: options.request,
		origin: options.origin,
		pathname: options.pathname,
		scripts,
		links,
		styles,
		route: options.route
	});

	return await coreRenderPage(mod, ctx, options.env); // NOTE: without "await", errors won’t get caught below
}
