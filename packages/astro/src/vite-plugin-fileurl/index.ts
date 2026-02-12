import type { Plugin as VitePlugin } from 'vite';

export default function vitePluginFileURL(): VitePlugin {
	return {
		name: 'astro:vite-plugin-file-url',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: /^file:\/\//,
			},
			handler(id, importer) {
				const rest = id.slice(7);
				return this.resolve(rest, importer);
			},
		},
	};
}
