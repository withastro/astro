import { h, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import StaticHtml from './static-html.js';

function check(Component) {
	return !!Component['ssrRender'];
}

async function renderToStaticMarkup(Component, props, slotted) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
	}
	const app = createSSRApp({ render: () => h(Component, props, slots) });
	const html = await renderToString(app);
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
