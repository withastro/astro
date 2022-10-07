import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';
import type {
	AstroRenderer,
	AstroSettings,
	ComponentInstance,
	RouteData,
	RuntimeMode,
	SSRElement,
	SSRLoadedRenderer,
} from '../../../@types/astro';
import { PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { LogOptions } from '../../logger/core.js';
import { isPage, resolveIdToUrl } from '../../util.js';
import { render as coreRender } from '../core.js';
import { RouteCache } from '../route-cache.js';
import { collectMdMetadata } from '../util.js';
import { getStylesForURL } from './css.js';
import { getScriptsForURL } from './scripts.js';

export interface SSROptions {
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

export type ComponentPreload = [SSRLoadedRenderer[], ComponentInstance];

const svelteStylesRE = /svelte\?svelte&type=style/;

async function loadRenderer(
	viteServer: ViteDevServer,
	renderer: AstroRenderer
): Promise<SSRLoadedRenderer> {
	const mod = (await viteServer.ssrLoadModule(renderer.serverEntrypoint)) as {
		default: SSRLoadedRenderer['ssr'];
	};
	return { ...renderer, ssr: mod.default };
}

export async function loadRenderers(
	viteServer: ViteDevServer,
	settings: AstroSettings
): Promise<SSRLoadedRenderer[]> {
	return Promise.all(settings.renderers.map((r) => loadRenderer(viteServer, r)));
}

export async function preload({
	settings,
	filePath,
	viteServer,
}: Pick<SSROptions, 'settings' | 'filePath' | 'viteServer'>): Promise<ComponentPreload> {
	// Important: This needs to happen first, in case a renderer provides polyfills.
	const renderers = await loadRenderers(viteServer, settings);
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
		settings,
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
	const scripts = await getScriptsForURL(filePath, viteServer);

	// Inject HMR scripts
	if (isPage(filePath, settings) && mode === 'development') {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: {
				type: 'module',
				src: await resolveIdToUrl(viteServer, 'astro/runtime/client/hmr.js'),
			},
			children: '',
		});
	}

	// TODO: We should allow adding generic HTML elements to the head, not just scripts
	for (const script of settings.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		} else if (script.stage === 'page' && isPage(filePath, settings)) {
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
		adapterName: settings.config.adapter?.name,
		links,
		styles,
		logging,
		markdown: {
			...settings.config.markdown,
			isAstroFlavoredMd: settings.config.legacy.astroFlavoredMarkdown,
		},
		mod,
		mode,
		origin,
		pathname,
		scripts,
		// Resolves specifiers in the inline hydrated scripts, such as:
		// - @astrojs/preact/client.js
		// - @/components/Foo.vue
		// - /Users/macos/project/src/Foo.vue
		// - C:/Windows/project/src/Foo.vue (normalized slash)
		async resolve(s: string) {
			const url = await resolveIdToUrl(viteServer, s);
			// Vite does not resolve .jsx -> .tsx when coming from hydration script import,
			// clip it so Vite is able to resolve implicitly.
			if (url.startsWith('/@fs') && url.endsWith('.jsx')) {
				return url.slice(0, -4);
			} else {
				return url;
			}
		},
		renderers,
		request,
		route,
		routeCache,
		site: settings.config.site
			? new URL(settings.config.base, settings.config.site).toString()
			: undefined,
		ssr: settings.config.output === 'server',
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
