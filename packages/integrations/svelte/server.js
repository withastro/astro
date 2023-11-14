import { VERSION } from 'svelte/compiler';

const isSvelte5 = VERSION.startsWith('5');

function check(Component) {
	if (isSvelte5) {
		return Component.toString().includes('$$payload');
	} else {
		return Component['render'] && Component['$$render'];
	}
}

function needsHydration(metadata) {
	// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
	return metadata.astroStaticSlot ? !!metadata.hydrate : true;
}

async function renderToStaticMarkup(Component, props, slotted, metadata) {
	const tagName = needsHydration(metadata) ? 'astro-slot' : 'astro-static-slot';
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = () =>
			`<${tagName}${key === 'default' ? '' : ` name="${key}"`}>${value}</${tagName}>`;
	}
	let html;
	if (isSvelte5) {
		const { render } = await import('svelte/server');
		html = render(Component, {
			props: {
				...props,
				$$slots: slots,
			},
		}).html;
	} else {
		html = Component.render(props, { $$slots: slots }).html;
	}
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
