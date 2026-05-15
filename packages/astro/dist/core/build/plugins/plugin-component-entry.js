import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
const astroEntryPrefix = '\0astro-entry:';
function pluginComponentEntry(internals) {
	const componentToExportNames = /* @__PURE__ */ new Map();
	mergeComponentExportNames(internals.discoveredHydratedComponents);
	mergeComponentExportNames(internals.discoveredClientOnlyComponents);
	for (const [componentId, exportNames] of componentToExportNames) {
		if (exportNames.some((name) => name.includes('.') || name === '*')) {
			componentToExportNames.delete(componentId);
		} else {
			componentToExportNames.set(componentId, Array.from(new Set(exportNames)));
		}
	}
	function mergeComponentExportNames(components) {
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
			if (Array.isArray(rollupInput)) {
				config.build.rollupOptions.input = rollupInput.map((id) => {
					if (componentToExportNames.has(id)) {
						return astroEntryPrefix + id;
					} else {
						return id;
					}
				});
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${astroEntryPrefix}`),
			},
			handler(id) {
				return id;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${astroEntryPrefix}`),
			},
			async handler(id) {
				const componentId = id.slice(astroEntryPrefix.length);
				const exportNames = componentToExportNames.get(componentId);
				if (exportNames) {
					return {
						code: `export { ${exportNames.join(', ')} } from ${JSON.stringify(componentId)}`,
					};
				}
			},
		},
	};
}
function normalizeEntryId(id) {
	return id.startsWith(astroEntryPrefix) ? id.slice(astroEntryPrefix.length) : id;
}
export { normalizeEntryId, pluginComponentEntry };
