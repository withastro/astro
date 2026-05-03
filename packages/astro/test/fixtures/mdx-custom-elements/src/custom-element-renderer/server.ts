import type { NamedSSRLoadedRendererValue, SSRResult } from 'astro';

type RendererContext = {
	result: SSRResult;
};

// Claims hyphenated string tags (custom elements per HTML spec)
async function check(this: RendererContext, Component: unknown) {
	return typeof Component === 'string' && Component.includes('-');
}

// Marks the output so tests can verify this renderer was invoked
async function renderToStaticMarkup(
	this: RendererContext,
	Component: string,
	props: Record<string, any>,
) {
	const attrs = Object.entries(props)
		.filter(([k]) => k !== 'children')
		.map(([k, v]) => ` ${k}="${String(v)}"`)
		.join('');
	return {
		attrs: {},
		html: `<${Component}${attrs} data-ssr="true"></${Component}>`,
	};
}

const renderer: NamedSSRLoadedRendererValue = {
	name: 'custom-element-renderer',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: false,
};

export default renderer;
