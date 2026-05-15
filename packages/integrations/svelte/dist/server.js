import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { incrementId } from './context.js';
function check(Component) {
	if (typeof Component !== 'function') return false;
	const componentString = Component.toString();
	return componentString.includes('$$payload') || componentString.includes('$$renderer');
}
function needsHydration(metadata) {
	return metadata?.astroStaticSlot ? !!metadata.hydrate : true;
}
async function renderToStaticMarkup(Component, props, slotted, metadata) {
	const tagName = needsHydration(metadata) ? 'astro-slot' : 'astro-static-slot';
	let children = void 0;
	let $$slots = void 0;
	let idPrefix;
	if (this && this.result) {
		idPrefix = incrementId(this.result);
	}
	const renderProps = {};
	for (const [key, value] of Object.entries(slotted)) {
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
	let html = result.body;
	html = html.replace(/\s+class=""/g, '');
	return { html };
}
const renderer = {
	name: '@astrojs/svelte',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
var server_default = renderer;
export { server_default as default };
