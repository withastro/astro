import StaticHtml from './static-html.js';
import { h, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

function check(Component) {
	return !!Component['ssrRender'];
}

async function renderToStaticMarkup(Component, props, children) {
	const slots = {};
	if (children != null) {
		slots.default = () => h(StaticHtml, { value: children });
	}
	const app = createSSRApp({ render: () => h(Component, props, slots) });
	const html = await renderToString(app);
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
