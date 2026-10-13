import { clientDirectives } from 'virtual:astro:client-directives';
import { getComponentAssets, renderConfig } from 'virtual:astro:component-assets';
import { renderers } from 'virtual:astro:renderers';
import { createRenderer } from '@astrojs/runtime/render';

export type { RenderOptions } from '@astrojs/runtime/render';

const renderer = createRenderer({
	renderers,
	clientDirectives,
	site: renderConfig.site,
	compressHTML: renderConfig.compressHTML,
	base: import.meta.env.BASE_URL,
	componentAssets: getComponentAssets,
});

/**
 * Renders a `.astro` component to a `Response`. The component must be imported in a server
 * environment of a Vite project that uses `astro()`.
 */
export const renderToResponse = renderer.renderToResponse;

/**
 * Renders a `.astro` component to an HTML string. See `renderToResponse()`.
 */
export const renderToString = renderer.renderToString;
