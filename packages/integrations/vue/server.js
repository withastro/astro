import { h, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import * as virtualApp from 'virtual:@astrojs/vue/app';
import StaticHtml from './static-html.js';

function check(Component) {
	return !!Component['ssrRender'] || !!Component['__ssrInlineRender'];
}

async function renderToStaticMarkup(Component, inputProps, slotted, metadata) {
	const slots = {};
	const props = { ...inputProps };
	delete props.slot;
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = () =>
			h(StaticHtml, {
				value,
				name: key === 'default' ? undefined : key,
				// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
				hydrate: metadata.astroStaticSlot ? !!metadata.hydrate : true,
			});
	}
	const app = createSSRApp({ render: () => h(Component, props, slots) });
	const setup = virtualApp.default;
	if (typeof setup === 'function') {
		await setup(app);
	}
	const html = await renderToString(app);
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
