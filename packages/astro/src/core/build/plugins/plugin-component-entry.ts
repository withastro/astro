import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

// The id prefix for ES modules (e.g. `.js`, `.jsx`, `.mts`, etc.)
const astroEntryEsmPrefix = '\0astro-entry-esm:';
// The id prefix for non-ES modules (e.g. `.vue`, `.svelte`, etc.)
const astroEntryNonEsmPrefix = '\0astro-entry-non-esm:';
// The suffix to add to non-ES module entry ids
const astroEntryNonEsmSuffix = '.js';
// A regex to detect if the entry id is an ES module
const esmModuleRegex = /\.m?[tj]sx?$/i;

/**
 * When adding hydrated or client:only components as Rollup inputs, sometimes we're not using all
 * of the export names, e.g. `import { Counter } from './ManyComponents.jsx'`. This plugin proxies
 * entries to re-export only the names the user is using.
 */
export function pluginComponentEntry(internals: BuildInternals): VitePlugin {
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
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
		},
		config(config) {
			const rollupInput = config.build?.rollupOptions?.input;
			// Astro passes an array of inputs by default. Even though other Vite plugins could
			// change this to an object, it shouldn't happen in practice as our plugin runs first.
			if (Array.isArray(rollupInput)) {
				// @ts-expect-error input is definitely defined here, but typescript thinks it doesn't
				config.build.rollupOptions.input = rollupInput.map((id) => {
					if (componentToExportNames.has(id)) {
						return buildEntryId(id);
					} else {
						return id;
					}
				});
			}
		},
		async resolveId(id) {
			if (isEntryId(id)) {
				return id;
			}
		},
		async load(id) {
			if (isEntryId(id)) {
				const componentId = normalizeEntryId(id);
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

function isEntryId(id: string): boolean {
	return id.startsWith(astroEntryEsmPrefix) || id.startsWith(astroEntryNonEsmPrefix);
}

function buildEntryId(id: string): string {
	if (esmModuleRegex.test(id)) {
		return astroEntryEsmPrefix + id;
	} else {
		return astroEntryNonEsmPrefix + id + astroEntryNonEsmSuffix;
	}
}

export function normalizeEntryId(id: string): string {
	if (id.startsWith(astroEntryEsmPrefix)) {
		return id.slice(astroEntryEsmPrefix.length);
	} else if (id.startsWith(astroEntryNonEsmPrefix)) {
		return id.slice(astroEntryNonEsmPrefix.length, -astroEntryNonEsmSuffix.length);
	} else {
		return id;
	}
}
