import { createRenderer } from '@astrojs/runtime';
import Widget from './widget.js';

export { default as Message } from './Message.astro';

export const renderer = createRenderer({
	renderers: [
		{
			name: 'widget',
			clientEntrypoint: '/widget-client.js',
			ssr: {
				check: (Component) => Component === Widget,
				renderToStaticMarkup: (Component, props) => ({ html: Component(props) }),
			},
		},
	],
	resolve: async (specifier) => specifier,
});
