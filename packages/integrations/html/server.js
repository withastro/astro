function check(Component) {
	return Component && typeof Component === 'object' && Component['astro:html'];
}

async function renderToStaticMarkup(Component, _, slots) {
	const html = Component.render({ slots });
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
