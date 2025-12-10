import fs from 'node:fs';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';
import { normalizePath, type Plugin as VitePlugin } from 'vite';

import type { AstroSettings } from '../types/astro.js';

type Alias = {
	find: RegExp;
	replacement: string;
};

/** Returns a list of compiled aliases. */
const getConfigAlias = (settings: AstroSettings): Alias[] | null => {
	const { tsConfig, tsConfigPath } = settings;
	if (!tsConfig || !tsConfigPath || !tsConfig.compilerOptions) return null;

	const { baseUrl, paths } = tsConfig.compilerOptions as CompilerOptions;

	// If paths exist but baseUrl doesn't, default to "." (tsconfig directory)
	const effectiveBaseUrl = baseUrl ?? (paths ? '.' : undefined);
	if (!effectiveBaseUrl) return null;

	// resolve the base url from the configuration file directory
	const resolvedBaseUrl = path.resolve(path.dirname(tsConfigPath), effectiveBaseUrl);

	const aliases: Alias[] = [];

	// compile any alias expressions and push them to the list
	if (paths) {
		for (const [alias, values] of Object.entries(paths)) {
			/** Regular Expression used to match a given path. */
			const find = new RegExp(
				`^${[...alias]
					.map((segment) =>
						segment === '*' ? '(.+)' : segment.replace(/[\\^$*+?.()|[\]{}]/, '\\$&'),
					)
					.join('')}$`,
			);

			for (const value of values) {
				/** Internal index used to calculate the matching id in a replacement. */
				let matchId = 0;
				/** String used to replace a matched path. */
				const replacement = [...normalizePath(path.resolve(resolvedBaseUrl, value))]
					.map((segment) => (segment === '*' ? `$${++matchId}` : segment === '$' ? '$$' : segment))
					.join('');

				aliases.push({ find, replacement });
			}
		}
	}

	// compile the baseUrl expression and push it to the list
	// - `baseUrl` changes the way non-relative specifiers are resolved
	// - if `baseUrl` exists then all non-relative specifiers are resolved relative to it
	// - only add this if an explicit baseUrl was provided (not the default)
	if (baseUrl) {
		aliases.push({
			find: /^(?!\.*\/|\.*$|\w:)(.+)$/,
			replacement: `${[...normalizePath(resolvedBaseUrl)]
				.map((segment) => (segment === '$' ? '$$' : segment))
				.join('')}/$1`,
		});
	}

	return aliases;
};

/** Generate vite.resolve.alias entries from tsconfig paths */
const getViteResolveAlias = (settings: AstroSettings) => {
	const { tsConfig, tsConfigPath } = settings;
	if (!tsConfig || !tsConfigPath || !tsConfig.compilerOptions) return [];

	const { baseUrl, paths } = tsConfig.compilerOptions as CompilerOptions;
	const effectiveBaseUrl = baseUrl ?? (paths ? '.' : undefined);
	if (!effectiveBaseUrl) return [];

	const resolvedBaseUrl = path.resolve(path.dirname(tsConfigPath), effectiveBaseUrl);
	const aliases: Array<{ find: string | RegExp; replacement: string; customResolver?: any }> = [];

	// Build aliases with custom resolver that tries multiple paths
	if (paths) {
		for (const [aliasPattern, values] of Object.entries(paths)) {
			const resolvedValues = values.map((v) => path.resolve(resolvedBaseUrl, v));

			const customResolver = (id: string) => {
				// Try each path in order
				// id is already the wildcard part (e.g., 'extra.css' for '@styles/*')
				// resolvedValues still have the * in them, so replace * with id
				for (const resolvedValue of resolvedValues) {
					const resolved = resolvedValue.replace('*', id);
					if (fs.existsSync(resolved)) {
						return resolved;
					}
				}
				return null;
			};

			aliases.push({
				// Build regex from alias pattern (e.g., '@styles/*' -> /^@styles\/(.+)$/)
				// First, escape special regex chars. Then replace * with a capture group (.+)
				find: new RegExp(
					`^${aliasPattern.replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '(.+)')}$`,
				),
				replacement: aliasPattern.includes('*') ? '$1' : aliasPattern,
				customResolver,
			});
		}
	}

	return aliases;
};

/** Returns a Vite plugin used to alias paths from tsconfig.json and jsconfig.json. */
export default function configAliasVitePlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin | null {
	const configAlias = getConfigAlias(settings);
	if (!configAlias) return null;

	const plugin: VitePlugin = {
		name: 'astro:tsconfig-alias',
		// use post to only resolve ids that all other plugins before it can't
		enforce: 'post',
		config() {
			// Return vite.resolve.alias config with custom resolvers
			return {
				resolve: {
					alias: getViteResolveAlias(settings),
				},
			};
		},
		async resolveId(id, importer, options) {
			if (isVirtualId(id)) return;

			// Handle aliases found from `compilerOptions.paths`. Unlike Vite aliases, tsconfig aliases
			// are best effort only, so we have to manually replace them here, instead of using `vite.resolve.alias`
			for (const alias of configAlias) {
				if (alias.find.test(id)) {
					const updatedId = id.replace(alias.find, alias.replacement);

					// Vite may pass an id with "*" when resolving glob import paths
					// Returning early allows Vite to handle the final resolution
					// See https://github.com/withastro/astro/issues/9258#issuecomment-1838806157
					if (updatedId.includes('*')) {
						return updatedId;
					}

					const resolved = await this.resolve(updatedId, importer, { skipSelf: true, ...options });
					if (resolved) return resolved;
				}
			}
		},
	};

	return plugin;
}

function isVirtualId(id: string) {
	return id.includes('\0') || id.startsWith('virtual:') || id.startsWith('astro:');
}
