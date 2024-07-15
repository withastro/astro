import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';

function check(Component) {
	// Svelte 5 generated components always accept these two props
	const str = Component.toString();
	return str.includes('$$payload') && str.includes('$$props');
}

function needsHydration(metadata) {
	// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
	return metadata.astroStaticSlot ? !!metadata.hydrate : true;
}

async function renderToStaticMarkup(Component, props, slotted, metadata) {
	const tagName = needsHydration(metadata) ? 'astro-slot' : 'astro-static-slot';

	let $$slots = undefined;
	for (const [key, value] of Object.entries(slotted)) {
		$$slots ??= {};
		$$slots[key] = createRawSnippet({
			render: () => `<${tagName}${key === 'default' ? '' : ` name="${key}"`}>${value}</${tagName}>`,
		});
	}

	const result = render(Component, {
		props: {
			...props,
			$$slots,
		},
	});
	return { html: result.body };
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
