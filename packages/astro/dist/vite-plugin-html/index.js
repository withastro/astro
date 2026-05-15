import { transform } from './transform/index.js';
function html() {
	return {
		name: 'astro:html',
		options(options) {
			options.plugins = options.plugins?.filter((p) => p.name !== 'vite:build-html');
		},
		transform: {
			filter: {
				id: /\.html$/,
			},
			handler: transform,
		},
	};
}
export { html as default };
