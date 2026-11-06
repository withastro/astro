async function check(Component) {
	return typeof Component === 'function';
}

async function renderToStaticMarkup(Component, props) {
	const vdom = Component(props);
	return { attrs: {}, html: `<${vdom.tag}>${vdom.text}</${vdom.tag}>` };
}

export default {
	name: 'custom-renderer',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: false,
};
