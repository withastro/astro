import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import type {
	AstroConfig,
	AstroRenderer,
	ComponentInstance,
	RouteData,
	RuntimeMode,
	SSRElement,
	SSRLoadedRenderer,
} from '../../../@types/astro';
import { prependForwardSlash } from '../../../core/path.js';
import { PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { LogOptions } from '../../logger/core.js';
import { isPage } from '../../util.js';
import { render as coreRender } from '../core.js';
import { RouteCache } from '../route-cache.js';
import { collectMdMetadata } from '../util.js';
import { getStylesForURL } from './css.js';
import { resolveClientDevPath } from './resolve.js';
import { getScriptsForURL } from './scripts.js';

export interface SSROptions {
	/** an instance of the AstroConfig */
	astroConfig: AstroConfig;
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

export type ComponentPreload = [SSRLoadedRenderer[], ComponentInstance];

const svelteStylesRE = /svelte\?svelte&type=style/;

async function loadRenderer(
	viteServer: ViteDevServer,
	renderer: AstroRenderer
): Promise<SSRLoadedRenderer> {
	// Vite modules can be out-of-date when using an un-resolved url
	// We also encountered inconsistencies when using the resolveUrl and resolveId helpers
	// We've found that pulling the ID directly from the urlToModuleMap is the most stable!
	const id =
		viteServer.moduleGraph.urlToModuleMap.get(renderer.serverEntrypoint)?.id ??
		renderer.serverEntrypoint;
	const mod = (await viteServer.ssrLoadModule(id)) as { default: SSRLoadedRenderer['ssr'] };
	return { ...renderer, ssr: mod.default };
}

export async function loadRenderers(
	viteServer: ViteDevServer,
	astroConfig: AstroConfig
): Promise<SSRLoadedRenderer[]> {
	return Promise.all(astroConfig._ctx.renderers.map((r) => loadRenderer(viteServer, r)));
}

export async function preload({
	astroConfig,
	filePath,
	viteServer,
}: Pick<SSROptions, 'astroConfig' | 'filePath' | 'viteServer'>): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(viteServer, astroConfig);
	// Load the module from the Vite SSR Runtime.
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
	if (viteServer.config.mode === 'development' || !mod?.$$metadata) {
		return [renderers, mod];
	}

	// append all nested markdown metadata to mod.$$metadata
	const modGraph = await viteServer.moduleGraph.getModuleByUrl(fileURLToPath(filePath));
	if (modGraph) {
		await collectMdMetadata(mod.$$metadata, modGraph, viteServer);
	}

	return [renderers, mod];
}

/** use Vite to SSR */
export async function render(
	renderers: SSRLoadedRenderer[],
	mod: ComponentInstance,
	ssrOpts: SSROptions
): Promise<Response> {
	const {
		astroConfig,
		filePath,
		logging,
		mode,
		origin,
		pathname,
		request,
		route,
		routeCache,
		viteServer,
	} = ssrOpts;
	// Add hoisted script tags
	const scripts = await getScriptsForURL(filePath, astroConfig, viteServer);

	// Inject HMR scripts
	if (isPage(filePath, astroConfig) && mode === 'development') {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: {
				type: 'module',
				src: '/@id/astro/runtime/client/hmr.js',
			},
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
		} else if (script.stage === 'page' && isPage(filePath, astroConfig)) {
			scripts.add({
				props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
				children: '',
			});
		}
	}

	// Pass framework CSS in as style tags to be appended to the page.
	const { urls: styleUrls, stylesMap } = await getStylesForURL(filePath, viteServer, mode);
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

	let response = await coreRender({
		adapterName: astroConfig.adapter?.name,
		links,
		styles,
		logging,
		markdown: {
			...astroConfig.markdown,
			isAstroFlavoredMd: astroConfig.legacy.astroFlavoredMarkdown,
		},
		mod,
		mode,
		origin,
		pathname,
		scripts,
		// Resolves specifiers in the inline hydrated scripts, such as "@astrojs/preact/client.js"
		async resolve(s: string) {
			if (s.startsWith('/@fs')) {
				return resolveClientDevPath(s);
			}
			return '/@id' + prependForwardSlash(s);
		},
		renderers,
		request,
		route,
		routeCache,
		site: astroConfig.site ? new URL(astroConfig.base, astroConfig.site).toString() : undefined,
		ssr: astroConfig.output === 'server',
		streaming: true,
	});

	return response;
}

export async function ssr(
	preloadedComponent: ComponentPreload,
	ssrOpts: SSROptions
): Promise<Response> {
	const [renderers, mod] = preloadedComponent;
	return await render(renderers, mod, ssrOpts); // NOTE: without "await", errors won’t get caught below
}
