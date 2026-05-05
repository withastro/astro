import type { NamedSSRLoadedRendererValue } from 'astro';

async function check(Component: unknown) {
	return typeof Component === 'string' && Component.includes('-');
}

async function renderToStaticMarkup(Component: string, props: Record<string, any>) {
	const attrs = Object.entries(props)
		.filter(([k]) => k !== 'children')
		.map(([k, v]) => ` ${k}="${String(v)}"`)
		.join('');
	return { attrs: {}, html: `<${Component}${attrs} data-ssr="true"></${Component}>` };
}

export default {
	name: 'custom-element-renderer',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: false,
} satisfies NamedSSRLoadedRendererValue;
