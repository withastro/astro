import { setup } from 'virtual:@astrojs/vue/app';
import type { AstroComponentMetadata, NamedSSRLoadedRendererValue } from 'astro';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { incrementId } from './context.js';
import StaticHtml from './static-html.js';
import type { RendererContext } from './types.js';

async function check(Component: any) {
	return !!Component['ssrRender'] || !!Component['__ssrInlineRender'];
}

async function renderToStaticMarkup(
	this: RendererContext,
	Component: any,
	inputProps: Record<string, any>,
	slotted: Record<string, any>,
	metadata?: AstroComponentMetadata,
) {
	let prefix;
	if (this && this.result) {
		prefix = incrementId(this.result);
	}
	const attrs: Record<string, any> = { prefix };

	const slots: Record<string, any> = {};
	const props = { ...inputProps };
	delete props.slot;
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = () =>
			h(StaticHtml, {
				value,
				name: key === 'default' ? undefined : key,
				// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
				hydrate: metadata?.astroStaticSlot ? !!metadata.hydrate : true,
			});
	}
	const app = createSSRApp({ render: () => h(Component, props, slots) });
	app.config.idPrefix = prefix;
	await setup(app);
	const html = await renderToString(app);
	return { html, attrs };
}

const renderer: NamedSSRLoadedRendererValue = {
	name: '@astrojs/vue',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};

export default renderer;
