import type { AstroComponentMetadata, NamedSSRLoadedRendererValue } from 'astro';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { incrementId } from './context.js';
import type { RendererContext } from './types.js';

function check(Component: any) {
	if (typeof Component !== 'function') return false;
	// Svelte 5 generated components always accept a `$$renderer` prop (previously called `$$payload`).
	// This assumes that the SSR build does not minify it (which Astro enforces by default).
	// This isn't the best check, but the only other option otherwise is to try to render the
	// component, which is taxing. We'll leave it as a last resort for the future for now.
	const componentString = Component.toString();
	return componentString.includes('$$payload') || componentString.includes('$$renderer');
}

function needsHydration(metadata?: AstroComponentMetadata) {
	// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
	return metadata?.astroStaticSlot ? !!metadata.hydrate : true;
}

async function renderToStaticMarkup(
	this: RendererContext,
	Component: any,
	props: Record<string, any>,
	slotted: Record<string, any>,
	metadata?: AstroComponentMetadata,
) {
	const tagName = needsHydration(metadata) ? 'astro-slot' : 'astro-static-slot';

	let children = undefined;
	let $$slots: Record<string, any> | undefined = undefined;
	let idPrefix;
	if (this && this.result) {
		idPrefix = incrementId(this.result);
	}
	const renderProps: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		// Legacy slot support
		$$slots ??= {};
		if (key === 'default') {
			$$slots.default = true;
			children = createRawSnippet(() => ({
				render: () => `<${tagName}>${value}</${tagName}>`,
			}));
		} else {
			$$slots[key] = createRawSnippet(() => ({
				render: () => `<${tagName} name="${key}">${value}</${tagName}>`,
			}));
		}
		// @render support for Svelte ^5.0
		const slotName = key === 'default' ? 'children' : key;
		renderProps[slotName] = createRawSnippet(() => ({
			render: () => `<${tagName}${key !== 'default' ? ` name="${key}"` : ''}>${value}</${tagName}>`,
		}));
	}

	const result = await render(Component, {
		props: {
			...props,
			children,
			$$slots,
			...renderProps,
		},
		idPrefix,
	});
	return { html: result.body };
}

const renderer: NamedSSRLoadedRendererValue = {
	name: '@astrojs/svelte',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};

export default renderer;
