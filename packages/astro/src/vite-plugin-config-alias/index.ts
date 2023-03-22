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

	const plugin: VitePlugin = {
		name: 'astro:tsconfig-alias',
		enforce: 'pre',
		configResolved(config) {
			// Patch config.createResolver as Vite would only use it to resolve in CSS files, which we want
			// the tsconfig aliases to take effect too. In the future, this could be easier with
			// https://github.com/vitejs/vite/pull/10555
			const _createResolver = config.createResolver;
			// @ts-expect-error override readonly property intentionally
			config.createResolver = function (...args1: any) {
				const resolver = _createResolver.apply(config, args1);
				return async function (...args2: any) {
					const id: string = args2[0];
					const importer: string = args2[1];

					// fast path so we don't run this extensive logic in prebundling
					if (importer.includes('node_modules')) {
						return resolver.apply(_createResolver, args2);
					}

					const fakePluginContext = {
						resolve: (_id: string, _importer: string) => resolver(_id, _importer),
					};

					// @ts-expect-error resolveId exists
					const resolved = await plugin.resolveId.apply(fakePluginContext, [id, importer]);
					if (resolved) return resolved;

					return resolver.apply(_createResolver, args2);
				};
			};
		},
		async resolveId(id, importer, options) {
			// Handle aliases found from `compilerOptions.paths`. Unlike Vite aliases, tsconfig aliases
			// are best effort only, so we have to manually replace them here, instead of using `vite.resolve.alias`
			for (const alias of configAlias) {
				if ((alias.find as RegExp).test(id)) {
					const updatedId = id.replace(alias.find, alias.replacement);
					const resolved = await this.resolve(updatedId, importer, { skipSelf: true, ...options });
					if (resolved) return resolved;
				}
			}

			// Handle baseUrl mapping for non-relative and non-root imports.
			// Since TypeScript only applies `baseUrl` autocompletions for files that exist
			// in the filesystem only, we can use this heuristic to skip resolve if needed.
			if (id.startsWith('.') || path.isAbsolute(id)) return;

			const resolved = path.posix.join(resolvedBaseUrl, id);
			return await this.resolve(resolved, importer, {
				skipSelf: true,
				...options,
			});
		},
	};

	return plugin;
}
