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

/**
 * Resolve an import id against tsconfig path aliases.
 * Tries each alias replacement in order, returning the first that maps to an existing file.
 */
function resolveWithAlias(id: string, configAlias: Alias[]): string | null {
	for (const alias of configAlias) {
		if (alias.find.test(id)) {
			const updatedId = id.replace(alias.find, alias.replacement);
			const stats = fs.statSync(updatedId, { throwIfNoEntry: false });
			if (stats && stats.isFile()) {
				return normalizePath(updatedId);
			}
		}
	}
	return null;
}

/**
 * Regex matching CSS @import statements with the specifier in capture group 1.
 * https://regex101.com/?regex=%40import%5Cs%2B%28%3F%3Aurl%5C%28%5Cs*%29%3F%5B%27%22%5D%28%5B%5E%27%22%5D%2B%29%5B%27%22%5D%5Cs*%5C%29%3F&testString=&flags=g&flavor=pcre2&delimiter=%2F
 */
const cssImportRE = /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?/g;

/**
 * Regex matching CSS url() references with the specifier in capture group 1.
 * Matches url('...') and url("...") but not @import url() (handled by cssImportRE).
 */
const cssUrlRE = /(?<!@import\s+)url\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Returns Vite plugins used to alias paths from tsconfig.json and jsconfig.json. */
export default function configAliasVitePlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin[] | null {
	const configAlias = getConfigAlias(settings);
	if (!configAlias) return null;

	return [
		// Pre-plugin: rewrite CSS @import aliases to absolute paths before Vite's CSS plugin.
		// Vite's internal CSS @import resolver (postcss-import) uses a mini plugin container
		// that doesn't include user resolveId hooks, so we must rewrite aliases in a transform
		// hook that runs before Vite's CSS processing.
		{
			name: 'astro:tsconfig-alias-css',
			enforce: 'pre',
			transform: {
				filter: {
					id: {
						include: /\.css$/,
					},
				},
				handler(code) {
					let hasReplacement = false;

					const replaceAliases = (match: string, importId: string) => {
						if (!importId) return match;

						const resolved = resolveWithAlias(importId, configAlias);
						if (resolved) {
							hasReplacement = true;
							return match.replace(importId, resolved);
						}
						return match;
					};

					let result = code;

					// Rewrite @import aliases
					if (result.includes('@import')) {
						result = result.replace(cssImportRE, replaceAliases);
					}

					// Rewrite url() aliases
					if (result.includes('url(')) {
						result = result.replace(cssUrlRE, replaceAliases);
					}

					if (hasReplacement) {
						return { code: result, map: null };
					}
				},
			},
		},
		// Post-plugin: resolve JS/TS imports using tsconfig path aliases via resolveId.
		{
			name: 'astro:tsconfig-alias',
			// use post to only resolve ids that all other plugins before it can't
			enforce: 'post',
			resolveId: {
				filter: {
					id: {
						include: configAlias.map((alias) => alias.find),
						exclude: /(?:\0|^virtual:|^astro:)/,
					},
				},
				async handler(id, importer, options) {
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

							const resolved = await this.resolve(updatedId, importer, {
								skipSelf: true,
								...options,
							});
							if (resolved) return resolved;
						}
					}
				},
			},
		},
	];
}
