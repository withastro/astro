import fs from 'node:fs';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';
import { normalizePath, type ResolvedConfig, type Plugin as VitePlugin } from 'vite';

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
		configResolved(config) {
			patchCreateResolver(config, plugin);
		},
		resolveId: {
			filter: {
				id: {
					exclude: /^(?!virtual:|astro:)[^\0]*$/,
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
	};

	return plugin;
}

/**
 * Vite's `createResolver` is used to resolve various things, including CSS `@import`.
 * We use vite.resolve.alias with custom resolvers to handle tsconfig paths in most cases,
 * but for CSS imports, we still need to patch createResolver as vite.resolve.alias
 * doesn't apply there. This function patches createResolver to inject our custom resolver.
 *
 * TODO: Remove this function once all tests pass with only the vite.resolve.alias approach,
 * which means CSS @import resolution will work without patching createResolver.
 */
function patchCreateResolver(config: ResolvedConfig, postPlugin: VitePlugin) {
	const _createResolver = config.createResolver;
	// @ts-expect-error override readonly property intentionally
	config.createResolver = function (...args1: any) {
		const resolver = _createResolver.apply(config, args1);
		return async function (...args2: any) {
			const id: string = args2[0];
			const importer: string | undefined = args2[1];
			const ssr: boolean | undefined = args2[3];

			// fast path so we don't run this extensive logic in prebundling
			if (importer?.includes('node_modules')) {
				return resolver.apply(_createResolver, args2);
			}

			const fakePluginContext = {
				resolve: (_id: string, _importer?: string) => resolver(_id, _importer, false, ssr),
			};
			const fakeResolveIdOpts = {
				assertions: {},
				isEntry: false,
				ssr,
			};

			const result = await resolver.apply(_createResolver, args2);
			if (result) return result;

			// @ts-expect-error resolveId exists
			const resolved = await (typeof postPlugin.resolveId === 'function'
				? postPlugin.resolveId
				: postPlugin.resolveId?.handler
			).apply(fakePluginContext, [id, importer, fakeResolveIdOpts]);
			if (resolved) return resolved;
		};
	};
}
