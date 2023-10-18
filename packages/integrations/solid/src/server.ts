import {
	createComponent,
	generateHydrationScript,
	NoHydration,
	renderToString,
	renderToStringAsync,
	ssr,
	Suspense,
} from 'solid-js/web';
import { getContext, incrementId } from './context.js';
import type { RendererContext } from './types.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

type RenderStrategy = 'sync' | 'async';

async function check(
	this: RendererContext,
	Component: any,
	props: Record<string, any>,
	children: any
) {
	if (typeof Component !== 'function') return false;

	// There is nothing particularly special about Solid components. Basically they are just functions.
	// In general, components from other frameworks (eg, MDX, React, etc.) tend to render as "undefined",
	// so we take advantage of this trick to decide if this is a Solid component or not.

	const { html } = await renderToStaticMarkup.call(this, Component, props, children, {
		// The purpose of check() is just to validate that this is a Solid component and not
		// React, etc. We should render in sync mode which should skip Suspense boundaries
		// or loading resources like external API calls.
		renderStrategy: 'sync' as RenderStrategy,
	});

	return typeof html === 'string';
}

// AsyncRendererComponentFn
async function renderToStaticMarkup(
	this: RendererContext,
	Component: any,
	props: Record<string, any>,
	{ default: children, ...slotted }: any,
	metadata?: undefined | Record<string, any>
) {
	const ctx = getContext(this.result);
	const renderId = metadata?.hydrate ? incrementId(ctx) : '';
	const needsHydrate = metadata?.astroStaticSlot ? !!metadata.hydrate : true;
	const tagName = needsHydrate ? 'astro-slot' : 'astro-static-slot';

	const renderStrategy = (metadata?.renderStrategy ?? 'async') as RenderStrategy;

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

		if (renderStrategy === 'sync') {
			// Sync Render:
			// <Component />
			// This render mode is not exposed directly to the end user. It is only
			// used in the check() function.
			return createComponent(Component, newProps);
		} else {
			if (needsHydrate) {
				// Hydrate + Async Render:
				// <Suspense>
				//   <Component />
				// </Suspense>
				return createComponent(Suspense, {
					get children() {
						return createComponent(Component, newProps);
					},
				});
			} else {
				// Static + Async Render
				// <NoHydration>
				//   <Suspense>
				//     <Component />
				// 	 </Suspense>
				// </NoHydration>
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

	let prepend = '';
	let componentHtml: string | undefined = undefined;

	if (needsHydrate && renderStrategy === 'async') {
		if (!ctx.hasSolidHydrationScript) {
			// The hydration script needs to come before to the first hydrating component of the page.
			//
			// One way to this would be to prepend the rendered output, eg:
			//
			// html += generateHydrationScript();
			//
			// However, in certain situations, nested components may be rendered depth-first, causing SolidJS
			// to put the hydration script in the wrong spot.
			//
			// Therefore we prefer to render to the extraHead when it is available.
			// Sometimes, the head has already been rendered, so  in those cases
			// we add the hydration script right before the component for now.
			// For example, in the following test, the head is already rendered before
			// this function is called:
			//
			// packages/astro/e2e/fixtures/nested-in-solid/package.json

			// NOTE: It seems that components on a page may be rendered in parallel using Promise.all()
			// or similar. To try to get the hydration script as high up as possibile, if not in the <head>
			// itself, this code block is intentionally written *before* the first `await` in the function.

			if (this.result._metadata.hasRenderedHead) {
				prepend = generateHydrationScript();
			} else {
				this.result._metadata.extraHead.push(generateHydrationScript());
			}

			ctx.hasSolidHydrationScript = true;
		}
	}

	if (renderStrategy === 'async') {
		componentHtml = await renderToStringAsync(renderFn, { renderId });
	} else {
		componentHtml = renderToString(renderFn, { renderId });
	}

	return {
		attrs: {
			'data-solid-render-id': renderId,
		},
		// componentHtml should in theory always be a string, but non-Solid components may
		// return undefined. The check() function relies on this to check if the component
		// is a solid component, thus we must check that componentHtml is actually a string
		// and not just blindly concategate it with a a hydration script.
		html: typeof componentHtml === 'string' ? prepend + componentHtml : componentHtml,
	};
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
