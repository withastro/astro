export default {
	check: (Component) => typeof Component === 'string' && Component.includes('-'),
	renderToStaticMarkup: (Component) => ({
		html: `<${Component} data-ssr="yes"></${Component}>`,
	}),
};
