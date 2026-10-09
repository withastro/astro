import type * as vite from 'vite';

const VIRTUAL_MODULE_ID = 'astro:container';

export default function astroContainer(): vite.Plugin {
	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^(${VIRTUAL_MODULE_ID})$`),
			},
			handler() {
				return this.resolve('astro/virtual-modules/container.js');
			},
		},
	};
}
