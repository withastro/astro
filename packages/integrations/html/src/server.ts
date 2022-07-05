function check(Component: any) {
	return Component && typeof Component === 'object' && Component['astro:html'];
}

async function renderToStaticMarkup(Component: any, _: any, slots: Record<string, string>) {
	const html = Component.render({ slots });
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
