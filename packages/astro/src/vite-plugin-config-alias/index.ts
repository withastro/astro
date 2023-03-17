import fs from 'fs';
import path from 'path';
import type { AstroSettings } from '../@types/astro';

import slash from 'slash';
import type { TsConfigJson } from 'tsconfig-resolver';
import type { Alias, Plugin as VitePlugin } from 'vite';

/** Returns a list of compiled aliases. */
const getConfigAlias = (
	paths: NonNullable<TsConfigJson.CompilerOptions['paths']>,
	baseUrl: NonNullable<TsConfigJson.CompilerOptions['baseUrl']>
): Alias[] => {
	const aliases: Alias[] = [];

	// compile any alias expressions and push them to the list
	for (const [alias, values] of Object.entries(paths)) {
		/** Regular Expression used to match a given path. */
		const find = new RegExp(
			`^${[...alias]
				.map((segment) =>
					segment === '*' ? '(.+)' : segment.replace(/[\\^$*+?.()|[\]{}]/, '\\$&')
				)
				.join('')}$`
		);

		/** Internal index used to calculate the matching id in a replacement. */
		let matchId = 0;

		for (const value of values) {
			/** String used to replace a matched path. */
			const replacement = [...path.posix.resolve(baseUrl, value)]
				.map((segment) => (segment === '*' ? `$${++matchId}` : segment === '$' ? '$$' : segment))
				.join('');

			aliases.push({ find, replacement });
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
	const { tsConfig, tsConfigPath } = settings;
	if (!tsConfig || !tsConfigPath || !tsConfig.compilerOptions) return null;

	const { baseUrl, paths } = tsConfig.compilerOptions;
	if (!baseUrl || !paths) return null;

	// resolve the base url from the configuration file directory
	const resolvedBaseUrl = path.posix.resolve(
		path.posix.dirname(slash(tsConfigPath).replace(/^\/?/, '/')),
		slash(baseUrl)
	);

	const configAlias = getConfigAlias(paths, resolvedBaseUrl);

	return {
		name: 'astro:tsconfig-alias',
		enforce: 'pre',
		config() {
			if (configAlias.length) {
				return {
					resolve: {
						alias: configAlias,
					},
				};
			}
		},
		resolveId(id) {
			if (id.startsWith('.') || id.startsWith('/')) return;

			// Handle baseUrl mapping for non-relative and non-root imports.
			// Since TypeScript only applies `baseUrl` autocompletions for files that exist
			// in the filesystem only, we can use this heuristic to skip resolve if needed.
			const resolved = path.posix.join(resolvedBaseUrl, id);
			if (fs.existsSync(resolved)) {
				return resolved;
			}
		},
	};
}
