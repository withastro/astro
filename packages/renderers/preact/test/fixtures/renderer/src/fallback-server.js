// A renderer that claims every component, tried after Preact.
export default {
	name: 'fallback',
	check: () => true,
	renderToStaticMarkup: () => ({ html: '<p>fallback</p>' }),
};
