function check(Component: any) {
	return typeof Component === 'object' && Component['@astrojs/html'];
}

async function renderToStaticMarkup(Component: { code: string }) {
	const html = Component.code;
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
