import {
	createComponent,
	generateHydrationScript,
	NoHydration,
	renderToString,
	renderToStringAsync,
	Suspense,
	ssr,
} from 'solid-js/web';
import { getContext, incrementId } from './context.js';
const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, children) {
	if (typeof Component !== 'function') return false;
	if (Component.name === 'QwikComponent') return false;
	if (Component.toString().includes('$$payload')) return false;
	let html;
	try {
		const result = await renderToStaticMarkup.call(this, Component, props, children, {
			// The purpose of check() is just to validate that this is a Solid component and not
			// React, etc. We should render in sync mode which should skip Suspense boundaries
			// or loading resources like external API calls.
			renderStrategy: 'sync',
		});
		html = result.html;
	} catch {}
	return typeof html === 'string';
}
async function renderToStaticMarkup(Component, props, { default: children, ...slotted }, metadata) {
	const ctx = getContext(this.result);
	const renderId = metadata?.hydrate ? incrementId(ctx) : '';
	const needsHydrate = metadata?.astroStaticSlot ? !!metadata.hydrate : true;
	const tagName = needsHydrate ? 'astro-slot' : 'astro-static-slot';
	const renderStrategy = metadata?.renderStrategy ?? 'async';
	const renderFn = () => {
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			const name = slotName(key);
			slots[name] = ssr(`<${tagName} name="${name}">${value}</${tagName}>`);
		}
		const newProps = {
			...props,
			...slots,
			// In Solid SSR mode, `ssr` creates the expected structure for `children`.
			children: children != null ? ssr(`<${tagName}>${children}</${tagName}>`) : children,
		};
		if (renderStrategy === 'sync') {
			return createComponent(Component, newProps);
		} else {
			if (needsHydrate) {
				return createComponent(Suspense, {
					get children() {
						return createComponent(Component, newProps);
					},
				});
			} else {
				return createComponent(NoHydration, {
					get children() {
						return createComponent(Suspense, {
							get children() {
								return createComponent(Component, newProps);
							},
						});
					},
				});
			}
		}
	};
	const componentHtml =
		renderStrategy === 'async'
			? await renderToStringAsync(renderFn, {
					renderId,
					// New setting since Solid 1.8.4 that fixes an errant hydration event appearing in
					// server only components. Not available in TypeScript types yet.
					// https://github.com/solidjs/solid/issues/1931
					// https://github.com/ryansolid/dom-expressions/commit/e09e255ac725fd59195aa0f3918065d4bd974e6b
					...{ noScripts: !needsHydrate },
				})
			: renderToString(renderFn, { renderId });
	return {
		attrs: {
			'data-solid-render-id': renderId,
		},
		html: componentHtml,
	};
}
const renderer = {
	name: '@astrojs/solid',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
	renderHydrationScript: () => generateHydrationScript(),
};
var server_default = renderer;
export { server_default as default };
