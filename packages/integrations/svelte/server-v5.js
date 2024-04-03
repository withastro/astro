import { add_snippet_symbol } from 'svelte/internal/server';
import { render } from 'svelte/server';

// Allow a slot to be rendered as a snippet (dev validation only)
const tagSlotAsSnippet = import.meta.env.DEV ? add_snippet_symbol : (s) => s;

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

	let children = undefined;
	let $$slots = undefined;
	for (const [key, value] of Object.entries(slotted)) {
		if (key === 'default') {
			children = tagSlotAsSnippet(() => `<${tagName}>${value}</${tagName}>`);
		} else {
			$$slots ??= {};
			$$slots[key] = tagSlotAsSnippet(() => `<${tagName} name="${key}">${value}</${tagName}>`);
		}
	}

	const { html } = render(Component, {
		props: {
			...props,
			children,
			$$slots,
		},
	});
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
