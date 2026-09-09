import {
	createComponent,
	generateHydrationScript,
	NoHydration,
	renderToStream,
	ssr,
} from '@solidjs/web';
import { provideRequestEvent } from '@solidjs/web/storage';
import type { NamedSSRLoadedRendererValue } from 'astro';
import { getContext, incrementId } from './context.js';
import type { RendererContext } from './types.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

type RenderStrategy = 'default' | 'probe';

// Render environment resolved through the integration's virtual module:
// the asset manifest loader (a live dev-server resolver in dev, the client
// build's manifest in production — resolves lazy boundary module URLs for
// preloads and the serialized per-render asset maps consumed during
// hydration), and, with server components enabled, the frames render plugin.
// Outside Vite (e.g. the Container API) the import fails and rendering
// proceeds without either.
type RenderExtras = {
	loadManifest: (() => unknown) | null;
	plugins: unknown[] | undefined;
};
let renderExtras: Promise<RenderExtras> | undefined;
function getRenderExtras(): Promise<RenderExtras> {
	return (renderExtras ??= (async () => {
		let loadManifest: RenderExtras['loadManifest'] = null;
		let plugins: RenderExtras['plugins'];
		try {
			const mod = await import('virtual:astro-solid-manifest');
			loadManifest = mod.loadManifest;
			if (mod.serverComponents) {
				const [frames, serverFunctions] = await Promise.all([
					import('@solidjs/web/frames'),
					import('@solidjs/web/server-functions'),
				]);
				// Direct (in-process) server-function calls during island SSR must
				// resolve to inline-renderable components branded with the call
				// address the client matches boundaries against. The endpoint's
				// response transform is installed by the handler virtual; config
				// merges per key.
				serverFunctions.configureServerFunctionsServer({
					transformDirectResult: frames.frameTransformDirectResult,
				});
				plugins = [frames.ServerComponentPlugin];
			}
		} catch {}
		return { loadManifest, plugins };
	})());
}

// Probe verdicts are stable per component function: cache them so the probe
// render's async work runs at most once per component type.
const checkCache = new WeakMap<any, boolean>();

const STYLE_OR_LINK_RE = /<style\b[^>]*>[\s\S]*?<\/style>|<link\b[^>]*>/gi;

// Islands render without a document, so Solid delivers head-bound output via
// onHead. Astro owns the document head and its build pipeline already handles
// statically-imported island CSS, but CSS belonging to lazy() boundary modules
// only exists in this channel — dropping it would leave server-rendered lazy
// content unstyled until the client loads the chunk. Keep the style-bearing
// tags (`<style>` and `<link rel="stylesheet">`, both manifest-resolved and
// dev inline styles) and inline them at the start of the island; drop
// everything else (preload/modulepreload hints, useHead tags, title
// machinery). Dedupe across islands on the same page via the per-result
// context so a shared lazy chunk's CSS ships once.
function extractIslandStyles(head: string, seen: Set<string>): string {
	let out = '';
	for (const tag of head.match(STYLE_OR_LINK_RE) ?? []) {
		let key: string;
		if (tag.startsWith('<link')) {
			if (!/rel=(?:"stylesheet"|'stylesheet'|stylesheet\b)/i.test(tag)) continue;
			const href = /href=(?:"([^"]*)"|'([^']*)')/i.exec(tag);
			key = href ? (href[1] ?? href[2]) : tag;
		} else {
			const devId = /data-vite-dev-id=(?:"([^"]*)"|'([^']*)')/i.exec(tag);
			key = devId ? (devId[1] ?? devId[2]) : tag;
		}
		if (seen.has(key)) continue;
		seen.add(key);
		out += tag;
	}
	return out;
}

async function check(
	this: RendererContext,
	Component: any,
	props: Record<string, any>,
	children: any,
) {
	if (typeof Component !== 'function') return false;
	const cached = checkCache.get(Component);
	if (cached !== undefined) return cached;

	let result = false;
	if (Component.name === 'QwikComponent') {
		result = false;
	} else {
		// Svelte component renders fine by Solid as an empty string. The only way to detect
		// if this isn't a Solid but Svelte component is to unfortunately copy the check
		// implementation of the Svelte renderer.
		// `$$payload` is the legacy prop name; `$$renderer` is the name used since Svelte 5.x.
		// Read the source reflectively: `Component.toString()` would trip `get`
		// traps on Proxy-based components (e.g. Motion One's `<Motion.div>`).
		let componentStr = '';
		try {
			componentStr = Function.prototype.toString.call(Component);
		} catch {}
		if (componentStr.includes('$$payload') || componentStr.includes('$$renderer')) {
			result = false;
		} else {
			// There is nothing particularly special about Solid components — they are just
			// functions. Probe-render the component and reject anything that errors,
			// including the foreign-vnode guard in renderToStaticMarkup tripping on
			// React/Preact elements. The probe must be a stream render: Solid 2.0's
			// async model only contains async work (and async errors) inside
			// renderToStream — a sync render of an async component would throw and
			// leave orphaned promise rejections behind.
			let errored = false;
			try {
				const { html } = await renderToStaticMarkup.call(this, Component, props, children, {
					renderStrategy: 'probe' as RenderStrategy,
					onProbeError() {
						errored = true;
					},
				});
				result = typeof html === 'string' && !errored;
			} catch {
				result = false;
			}
		}
	}

	checkCache.set(Component, result);
	return result;
}

// AsyncRendererComponentFn
async function renderToStaticMarkup(
	this: RendererContext,
	Component: any,
	props: Record<string, any>,
	{ default: children, ...slotted }: any,
	metadata?: Record<string, any>,
) {
	const ctx = getContext(this.result);
	const renderId = metadata?.hydrate ? incrementId(ctx) : '';
	const needsHydrate = metadata?.astroStaticSlot ? !!metadata.hydrate : true;
	const tagName = needsHydrate ? 'astro-slot' : 'astro-static-slot';

	const isProbe = metadata?.renderStrategy === 'probe';

	const renderFn = () => {
		const slots: Record<string, any> = {};
		for (const [key, value] of Object.entries(slotted)) {
			const name = slotName(key);
			slots[name] = ssr(`<${tagName} name="${name}">${value}</${tagName}>`);
		}
		// Note: create newProps to avoid mutating `props` before they are serialized
		const newProps = {
			...props,
			...slots,
			// In Solid SSR mode, `ssr` creates the expected structure for `children`.
			children: children != null ? ssr(`<${tagName}>${children}</${tagName}>`) : children,
		};

		// Async is first-class in Solid 2.0 — no Suspense wrapper needed; the
		// stream settles every boundary before the awaited HTML resolves.
		const value = createComponent(Component, newProps);

		// 2.0's SSR resolver renders unknown objects as inert markers instead of
		// throwing, so a foreign component could survive the check() probe.
		// Reject framework vnodes (React/Preact `$$typeof`) explicitly; the
		// error routes through onError and fails the probe.
		if (value != null && typeof value === 'object' && '$$typeof' in value) {
			throw new Error('Not a Solid component: rendered a foreign framework vnode');
		}

		if (needsHydrate) {
			return value;
		}
		// Static render — ship no hydration markers or serialized data.
		return createComponent(NoHydration, {
			get children() {
				return value;
			},
		});
	};

	// Buffered stream render: awaiting the renderToStream thenable resolves
	// with the complete HTML once every boundary settles. The stream never
	// rejects — uncontained render errors surface through onError (errors
	// handled by an Errored boundary do not reach it) and are rethrown below
	// for real renders so Astro can report them.
	let errored = false;
	let renderError: unknown;
	let head = '';
	const doRender = async () => {
		const { loadManifest, plugins } = await getRenderExtras();
		return renderToStream(renderFn, {
			renderId,
			noScripts: !needsHydrate || isProbe,
			manifest: loadManifest?.() as any,
			plugins: plugins as any,
			onError(err: unknown) {
				if (isProbe) {
					metadata!.onProbeError();
				} else if (!errored) {
					errored = true;
					renderError = err;
				}
			},
			// Capture head-bound output. Probe renders discard it — they must not
			// consume style dedupe keys the real render needs.
			onHead: isProbe
				? () => {}
				: (h: string) => {
						head += h;
					},
		});
	};

	// Scope the render to a Solid request event so `getRequestEvent()` (and
	// server functions called directly during SSR) see the page's request.
	// One event per page render, shared across islands. Astro's middleware
	// locals ride along — reached through the Astro global, whose page
	// partial the result caches per request anyway.
	const request = this.result?.request;
	if (request && !ctx.event) {
		const locals = this.result.createAstro({}, null).locals as
			| Record<string, unknown>
			| undefined;
		ctx.event = { request, locals: locals ?? {} };
	}
	const componentHtml = await (ctx.event ? provideRequestEvent(ctx.event, doRender) : doRender());
	if (errored) throw renderError;

	// Inline style-bearing head output (lazy boundary CSS, dev styles) at the
	// island start; see extractIslandStyles. Serializer scripts already ride
	// inside island markup, so extra non-marker nodes are safe for hydration.
	const styles = head && !isProbe ? extractIslandStyles(head, ctx.styles) : '';

	return {
		attrs: {
			'data-solid-render-id': renderId,
		},
		html: styles + componentHtml,
	};
}

const renderer: NamedSSRLoadedRendererValue = {
	name: '@astrojs/solid',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
	renderHydrationScript: () => generateHydrationScript(),
};

export default renderer;
