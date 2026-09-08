import { transform } from './transform/index.js';

export default function html() {
	return {
		name: 'astro:html',
		options(options: any) {
			options.plugins = options.plugins?.filter((p: any) => p.name !== 'vite:build-html');
		},
		transform: {
			filter: {
				id: /\.html$/,
			},
			handler: transform,
		},
	};
}
