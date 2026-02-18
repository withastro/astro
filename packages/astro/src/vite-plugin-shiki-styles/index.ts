import type { Plugin } from 'vite';
import { globalShikiStyleCollector } from '@astrojs/markdown-remark';

const VIRTUAL_SHIKI_STYLES_ID = 'virtual:astro:shiki-styles.css';
const RESOLVED_VIRTUAL_SHIKI_STYLES_ID = '\0virtual:astro:shiki-styles.css';

/**
 * Vite plugin that provides a virtual CSS module containing all Shiki syntax highlighting styles.
 *
 * This plugin collects styles from the style-to-class transformer used by both Code.astro
 * and Markdown processing, and bundles them into a single CSS file. The .css extension
 * ensures Vite processes this through its CSS pipeline (minification, hashing, etc.).
 */
export function vitePluginShikiStyles(): Plugin {
	return {
		name: 'astro:shiki-styles',

		buildStart() {
			// Clear styles at the start of each build to prevent stale data
			globalShikiStyleCollector.clear();
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_SHIKI_STYLES_ID}$`),
			},
			handler(id) {
				if (id === VIRTUAL_SHIKI_STYLES_ID) {
					return RESOLVED_VIRTUAL_SHIKI_STYLES_ID;
				}
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_SHIKI_STYLES_ID}$`),
			},
			handler(id) {
				if (id === RESOLVED_VIRTUAL_SHIKI_STYLES_ID) {
					const css = globalShikiStyleCollector.collectCSS();
					// Return CSS or a comment if no styles generated yet
					return css || '/* Shiki styles will be generated during build */';
				}
			},
		},

		// Handle HMR invalidation when markdown/astro files change
		handleHotUpdate({ file, server }) {
			// If a Markdown or astro file changed, invalidate the virtual CSS module
			// so it regenerates with updated styles
			if (file.endsWith('.md') || file.endsWith('.mdx') || file.endsWith('.astro')) {
				const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_SHIKI_STYLES_ID);
				if (module) {
					server.moduleGraph.invalidateModule(module);
				}
			}
		},
	};
}
