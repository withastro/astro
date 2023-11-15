function check(Component) {
	return Component['render'] && Component['$$render'];
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
	const { html } = Component.render(props, { $$slots: slots });
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
