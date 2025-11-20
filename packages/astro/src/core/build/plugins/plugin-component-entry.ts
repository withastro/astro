import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';

const astroEntryPrefix = '\0astro-entry:';
const astroEntrySuffix = ".mjs";

/**
 * When adding hydrated or client:only components as Rollup inputs, sometimes we're not using all
 * of the export names, e.g. `import { Counter } from './ManyComponents.jsx'`. This plugin proxies
 * entries to re-export only the names the user is using.
 */
function vitePluginComponentEntry(internals: BuildInternals): VitePlugin {
	const componentToExportNames = new Map<string, string[]>();

	mergeComponentExportNames(internals.discoveredHydratedComponents);
	mergeComponentExportNames(internals.discoveredClientOnlyComponents);

	for (const [componentId, exportNames] of componentToExportNames) {
		// If one of the imports has a dot, it's a namespaced import, e.g. `import * as foo from 'foo'`
		// and `<foo.Counter />`, in which case we re-export `foo` entirely and we don't need to handle
		// it in this plugin as it's default behaviour from Rollup.
		if (exportNames.some((name) => name.includes('.') || name === '*')) {
			componentToExportNames.delete(componentId);
		} else {
			componentToExportNames.set(componentId, Array.from(new Set(exportNames)));
		}
	}

	function mergeComponentExportNames(components: Map<string, string[]>) {
		for (const [componentId, exportNames] of components) {
			if (componentToExportNames.has(componentId)) {
				componentToExportNames.get(componentId)?.push(...exportNames);
			} else {
				componentToExportNames.set(componentId, exportNames);
			}
		}
	}

	return {
		name: '@astro/plugin-component-entry',
		enforce: 'pre',
		config(config) {
			const rollupInput = config.build?.rollupOptions?.input;
			// Astro passes an array of inputs by default. Even though other Vite plugins could
			// change this to an object, it shouldn't happen in practice as our plugin runs first.
			if (Array.isArray(rollupInput)) {
				config!.build!.rollupOptions!.input = rollupInput.map((id) => {
					if (componentToExportNames.has(id)) {
						// We need to add the suffix to the id so that this file is always treated 
						// as a JS module. This can avoid other single-file-component plugins treating 
						// this as a component. 
						// 
						// For example, if the id ends with `.svelte`, it will be treated as a Svelte 
						// component by `@sveltejs/vite-plugin-svelte`, which is not what we want.
						return astroEntryPrefix + id + astroEntrySuffix;
					} else {
						return id;
					}
				});
			}
		},
		async resolveId(id) {
			if (id.startsWith(astroEntryPrefix)) {
				return id;
			}
		},
		async load(id) {
			if (id.startsWith(astroEntryPrefix)) {
				const componentId = id.slice(astroEntryPrefix.length, -astroEntrySuffix.length);
				const exportNames = componentToExportNames.get(componentId);
				if (exportNames) {
					return {
						code: `export { ${exportNames.join(', ')} } from ${JSON.stringify(componentId)}`,
					};
				}
			}
		},
	};
}

export function normalizeEntryId(id: string): string {
	return id.startsWith(astroEntryPrefix) ? id.slice(astroEntryPrefix.length, -astroEntrySuffix.length) : id;
}

export function pluginComponentEntry(internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['client'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginComponentEntry(internals),
				};
			},
		},
	};
}
