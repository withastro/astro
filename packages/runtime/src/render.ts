import { getDefaultClientDirectives } from './core/client-directive/default.js';
import { Slots } from './core/render/slots.js';
import { ASTRO_GENERATOR } from './server/astro-global.js';
import { type AstroComponentFactory, renderPage } from './server/index.js';
import { SlotString } from './server/render/slot.js';
import type {
	AstroGlobal,
	SSRComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
	StylesheetAsset,
} from './types.js';

/** What rendering one component tree needs from the build or the dev server. */
export interface ComponentAssets {
	/** Stylesheets of every module in the tree, in import order. */
	styles: StylesheetAsset[];
	/**
	 * URLs of island components, renderer client entrypoints and component scripts, keyed by the
	 * specifier the render runtime passes to `SSRResult.resolve()`.
	 */
	resolve: Record<string, string>;
	/** Head metadata of the `.astro` modules in the tree, for `SSRResult.componentMetadata`. */
	componentMetadata: [string, SSRComponentMetadata][];
}

export interface RenderOptions {
	/** Props passed to the component. */
	props?: Record<string, any>;
	/** HTML strings for the component's slots, keyed by slot name (`default` for the default slot). */
	slots?: Record<string, string>;
	/**
	 * The request being answered. Exposed to components as `Astro.request` and `Astro.url`.
	 *
	 * @default a `GET` request to `http://localhost/`
	 */
	request?: Request;
	/**
	 * Renders a fragment: no `<!DOCTYPE html>` and no head content (stylesheets) are added. When
	 * `false`, the component is rendered as a document and its stylesheets are injected into its
	 * `<head>`, or before its first element when it has none.
	 *
	 * @default false
	 */
	partial?: boolean;
}

export interface RendererOptions {
	/** Loaded renderers for framework components. */
	renderers?: SSRLoadedRenderer[];
	/**
	 * Client directive scripts, keyed by directive name.
	 *
	 * @default the built-in directives (`load`, `idle`, `visible`, `media`, `only`)
	 */
	clientDirectives?: Map<string, string>;
	/**
	 * Returns the URL of an island component, a renderer client entrypoint or a component script.
	 * Used for the specifiers `componentAssets` does not resolve.
	 *
	 * @default throws for every specifier
	 */
	resolve?: (specifier: string) => Promise<string>;
	/** `Astro.site`. */
	site?: string;
	/** @default 'jsx' */
	compressHTML?: boolean | 'jsx';
	/** @default '/' */
	base?: string;
	/**
	 * Returns the stylesheets, island URLs and head metadata of the component tree whose root has
	 * the given `moduleId` (the compiled component's `moduleId`, or `''`).
	 *
	 * @default no assets
	 */
	componentAssets?: (moduleId: string) => Promise<ComponentAssets>;
	/**
	 * Inline module scripts added to the `<head>` of every document (not with `partial`), such as
	 * the `devHeadScript` of a renderer.
	 *
	 * @default []
	 */
	headScripts?: string[];
}

export interface Renderer {
	/** Renders a `.astro` component to a `Response`. */
	renderToResponse(Component: AstroComponentFactory, options?: RenderOptions): Promise<Response>;
	/** Renders a `.astro` component to an HTML string. See `renderToResponse()`. */
	renderToString(Component: AstroComponentFactory, options?: RenderOptions): Promise<string>;
}

type ResolvedRendererOptions = Required<Omit<RendererOptions, 'site'>> & { site?: string };

const NO_ASSETS: ComponentAssets = { styles: [], resolve: {}, componentMetadata: [] };

/**
 * Creates a renderer for `.astro` components that needs neither Vite nor virtual modules: the
 * components can be compiled ahead of time and rendered in any JavaScript runtime.
 */
export function createRenderer(options: RendererOptions = {}): Renderer {
	const config: ResolvedRendererOptions = {
		renderers: options.renderers ?? [],
		clientDirectives: options.clientDirectives ?? getDefaultClientDirectives(),
		resolve:
			options.resolve ??
			(async (specifier) => {
				throw new Error(
					`Could not resolve "${specifier}" for client-side use. Islands and scripts must be imported by a component compiled in this Vite project.`,
				);
			}),
		site: options.site,
		compressHTML: options.compressHTML ?? 'jsx',
		base: options.base ?? '/',
		componentAssets: options.componentAssets ?? (async () => NO_ASSETS),
		headScripts: options.headScripts ?? [],
	};
	async function renderToResponse(
		Component: AstroComponentFactory,
		renderOptions: RenderOptions = {},
	): Promise<Response> {
		const result = await createResult(config, Component, renderOptions);
		const slots: Record<string, SlotString> = {};
		for (const [name, html] of Object.entries(renderOptions.slots ?? {})) {
			slots[name] = new SlotString(html, null);
		}
		return renderPage(result, Component, renderOptions.props ?? {}, slots, false);
	}
	return {
		renderToResponse,
		async renderToString(Component, renderOptions) {
			const response = await renderToResponse(Component, renderOptions);
			return response.text();
		},
	};
}

async function createResult(
	config: ResolvedRendererOptions,
	Component: AstroComponentFactory,
	{ request = new Request('http://localhost/'), partial = false }: RenderOptions,
): Promise<SSRResult> {
	const assets = await config.componentAssets(Component.moduleId ?? '');
	const url = new URL(request.url);
	const result: SSRResult = {
		base: config.base,
		userAssetsBase: undefined,
		cancelled: false,
		clientDirectives: config.clientDirectives,
		inlinedScripts: new Map(),
		componentMetadata: new Map(assets.componentMetadata),
		compressHTML: config.compressHTML,
		createAstro(props, slotValues) {
			const astro = {
				props,
				self: null,
				slots: new Slots(result, slotValues, { warn: (_label, message) => console.warn(message) }),
				request,
				url,
				site: config.site ? new URL(config.site) : undefined,
				generator: ASTRO_GENERATOR,
			};
			return astro as unknown as AstroGlobal;
		},
		links: new Set(),
		partial,
		pathname: url.pathname,
		renderers: config.renderers,
		async resolve(specifier) {
			return assets.resolve[specifier] ?? config.resolve(specifier);
		},
		response: {
			status: 200,
			statusText: 'OK',
			headers: new Headers({ 'Content-Type': 'text/html' }),
		},
		scripts: new Set(
			config.headScripts.map((children) => ({ props: { type: 'module' }, children })),
		),
		styles: new Set(assets.styles.map(createStyleElement)),
		async getServerIslandNameMap() {
			return new Map();
		},
		key: Promise.reject(new Error('Server islands are not supported by the render API.')),
		trailingSlash: 'ignore',
		_metadata: {
			hasHydrationScript: false,
			rendererSpecificHydrationScripts: new Set(),
			hasRenderedHead: false,
			renderedScripts: new Set(),
			hasDirectives: new Set(),
			hasRenderedServerIslandRuntime: false,
			headInTree: false,
			extraHead: [],
			extraStyleHashes: [],
			extraScriptHashes: [],
			propagators: new Set(),
			routeHasPropagation: false,
			pendingSlotEvaluations: [],
			templateDepth: 0,
		},
		cspDestination: 'header',
		shouldInjectCspMetaTags: false,
		cspAlgorithm: 'SHA-256',
		directives: [],
		scriptDirective: { resources: [], hashes: [], strictDynamic: false },
		styleDirective: { resources: [], hashes: [] },
	};
	// Unused unless a component renders a server island; avoid an unhandled rejection.
	result.key.catch(() => {});
	return result;
}

function createStyleElement(style: StylesheetAsset): SSRElement {
	if (style.type === 'external') {
		return { props: { rel: 'stylesheet', href: style.src }, children: '' };
	}
	return {
		props: style.viteDevId ? { type: 'text/css', 'data-vite-dev-id': style.viteDevId } : {},
		children: style.content,
	};
}
