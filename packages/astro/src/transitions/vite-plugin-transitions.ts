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

		// Importing components with a random marker ensures that vite treates them as new
		// and finally reinserts style sheets of imported styles in the head of the document.
		// This is used by the astro-island custom components to re-establish imported style sheets
		// for client:only components in DEV mode.
		transform(code, id) {
			if (process.env.NODE_ENV === 'development') {
				const hasMarker = id.match(/[?&]client-only=([^&?]+)/);
				if (hasMarker) {
					const marker = hasMarker[1];
					// We are only interested in imports with a module identifier ending with a file extension.
					// This excludes imports from packages like "svelte", "react/jsx-dev-runtime" or "astro".
					return code.replaceAll(
						/\bimport\s([^"';\n]*)("|')([^"':@\s]+\.\w+)\2/g,
						(_, p1, p2, p3) => {
							const delimiter = p3.includes('?') ? '&' : '?';
							return `import ${p1}${p2}${p3}${delimiter}client-only=${marker}${p2}`;
						}
					);
				}
			}
			return null;
		},
	};
}
