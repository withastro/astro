import * as vite from 'vite';

const virtualModuleId = 'astro:transitions';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const virtualClientModuleId = 'astro:transitions/client';
const resolvedVirtualClientModuleId = '\0' + virtualClientModuleId;

// The virtual module for the astro:transitions namespace
export default function astroTransitions(): vite.Plugin {
	return {
		name: 'astro:transitions',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			if (id === virtualClientModuleId) {
				return resolvedVirtualClientModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
				export * from "astro/transitions";
				export { default as ViewTransitions } from "astro/components/ViewTransitions.astro";
			`;
			}
			if (id === resolvedVirtualClientModuleId) {
				return `
				export * from "astro/transitions/router";
			`;
			}
		},

		// View transitions want to know which styles to preserve for persistent client:only components.
		// The client-side router probes component URLs with a random query parameter ?client-only=...
		// This parameter is passed on to imports that might (indirectly) contain styles
		// When vite finally adds the styles to the page, they can be identified by that query parameter
		// All this happens only in DEV mode.
		transform(code, id) {
			if (process.env.NODE_ENV === 'development') {
				const match = id.match(/\?client-only=(.+)$/);
				if (match) {
					// For CSS files, send a quick response so that vite has something to insert into the page.
					// The content is not important here, only the viteDevId resulting from the query.
					if (vite.isCSSRequest(id)) {
						return '/**/';
					}
					// Non-CSS files can contain (indirect) imports of a style file.
					// We are only interested in imports with a module identifier ending with a file extension.
					// This excludes imports from packages like "svelte", "react/jsx-dev-runtime" or "astro".
					return code.replaceAll(
						/\bimport\s([^"';\n]*)("|')([^"':@\s]+\.\w+)\2/g,
						`import $1$2$3?client-only=${match[1]}$2`
					);
				}
			}
			return null;
		},
	};
}
