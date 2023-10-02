import type { Alias, Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';

/**
 * `@rollup/plugin-alias` doesn't resolve aliases in Rollup input by default. This plugin fixes it
 * with a partial fork of it's resolve function. https://github.com/rollup/plugins/blob/master/packages/alias/src/index.ts
 * When https://github.com/rollup/plugins/pull/1402 is merged, we can remove this plugin.
 */
export function vitePluginAliasResolve(internals: BuildInternals): VitePlugin {
	let aliases: Alias[];

	return {
		name: '@astro/plugin-alias-resolve',
		enforce: 'pre',
		configResolved(config) {
			aliases = config.resolve.alias;
		},
		async resolveId(id, importer, opts) {
			if (
				!importer &&
				(internals.discoveredHydratedComponents.has(id) ||
					internals.discoveredClientOnlyComponents.has(id))
			) {
				const matchedEntry = aliases.find((entry) => matches(entry.find, id));
				if (!matchedEntry) {
					return null;
				}

				const updatedId = id.replace(matchedEntry.find, matchedEntry.replacement);

				return this.resolve(updatedId, importer, Object.assign({ skipSelf: true }, opts)).then(
					(resolved) => resolved || { id: updatedId }
				);
			}
		},
	};
}

function matches(pattern: string | RegExp, importee: string) {
	if (pattern instanceof RegExp) {
		return pattern.test(importee);
	}
	if (importee.length < pattern.length) {
		return false;
	}
	if (importee === pattern) {
		return true;
	}
	return importee.startsWith(pattern + '/');
}

export function pluginAliasResolve(internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['client'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginAliasResolve(internals),
				};
			},
		},
	};
}
