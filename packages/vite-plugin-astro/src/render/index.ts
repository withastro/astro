import { clientDirectives } from 'virtual:astro:client-directives';
import { getComponentAssets, renderConfig } from 'virtual:astro:component-assets';
import { renderers } from 'virtual:astro:renderers';
import { Slots } from '../core/render/slots.js';
import { ASTRO_GENERATOR } from '../runtime/server/astro-global.js';
import { type AstroComponentFactory, renderPage } from '../runtime/server/index.js';
import { SlotString } from '../runtime/server/render/slot.js';
import type { AstroGlobal, SSRElement, SSRResult, StylesheetAsset } from '../types.js';

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

/**
 * Renders a `.astro` component to a `Response`. The component must be imported in a server
 * environment of a Vite project that uses `astro()`.
 */
export async function renderToResponse(
	Component: AstroComponentFactory,
	options: RenderOptions = {},
): Promise<Response> {
	const result = await createResult(Component, options);
	const slots: Record<string, SlotString> = {};
	for (const [name, html] of Object.entries(options.slots ?? {})) {
		slots[name] = new SlotString(html, null);
	}
	return renderPage(result, Component, options.props ?? {}, slots, false);
}

/**
 * Renders a `.astro` component to an HTML string. See `renderToResponse()`.
 */
export async function renderToString(
	Component: AstroComponentFactory,
	options: RenderOptions = {},
): Promise<string> {
	const response = await renderToResponse(Component, options);
	return response.text();
}

async function createResult(
	Component: AstroComponentFactory,
	{ request = new Request('http://localhost/'), partial = false }: RenderOptions,
): Promise<SSRResult> {
	const assets = await getComponentAssets(Component.moduleId ?? '');
	const url = new URL(request.url);
	const base = import.meta.env.BASE_URL;
	const result: SSRResult = {
		base,
		userAssetsBase: undefined,
		cancelled: false,
		clientDirectives,
		inlinedScripts: new Map(),
		componentMetadata: new Map(assets.componentMetadata),
		compressHTML: renderConfig.compressHTML,
		createAstro(props, slotValues) {
			const astro = {
				props,
				self: null,
				slots: new Slots(result, slotValues, { warn: (_label, message) => console.warn(message) }),
				request,
				url,
				site: renderConfig.site ? new URL(renderConfig.site) : undefined,
				generator: ASTRO_GENERATOR,
			};
			return astro as unknown as AstroGlobal;
		},
		links: new Set(),
		partial,
		pathname: url.pathname,
		renderers,
		async resolve(specifier) {
			const resolved = assets.resolve[specifier];
			if (resolved === undefined) {
				throw new Error(
					`Could not resolve "${specifier}" for client-side use. Islands and scripts must be imported by a component compiled in this Vite project.`,
				);
			}
			return resolved;
		},
		response: { status: 200, statusText: 'OK', headers: new Headers() },
		scripts: new Set(),
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
