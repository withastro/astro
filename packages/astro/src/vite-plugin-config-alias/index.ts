import * as path from 'path';
import type { AstroSettings } from '../@types/astro';

import type * as vite from 'vite';

/** Result of successfully parsed tsconfig.json or jsconfig.json. */
export declare interface Alias {
	find: RegExp;
	replacement: string;
}

/** Returns a path with its slashes replaced with posix slashes. */
const normalize = (pathname: string) => String(pathname).split(path.sep).join(path.posix.sep);

/** Returns a list of compiled aliases. */
const getConfigAlias = (settings: AstroSettings): Alias[] | null => {
	/** Closest tsconfig.json or jsconfig.json */
	const config = settings.tsConfig;
	const configPath = settings.tsConfigPath;

	// if no config was found, return null
	if (!config || !configPath) return null;

	/** Compiler options from tsconfig.json or jsconfig.json. */
	const compilerOptions = Object(config.compilerOptions);

	// if no compilerOptions.baseUrl was defined, return null
	if (!compilerOptions.baseUrl) return null;

	// resolve the base url from the configuration file directory
	const baseUrl = path.posix.resolve(
		path.posix.dirname(normalize(configPath).replace(/^\/?/, '/')),
		normalize(compilerOptions.baseUrl)
	);

	/** List of compiled alias expressions. */
	const aliases: Alias[] = [];

	// compile any alias expressions and push them to the list
	for (let [alias, values] of Object.entries(
		Object(compilerOptions.paths) as { [key: string]: string[] }
	)) {
		values = [].concat(values as never);

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

		for (let value of values) {
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
}): vite.PluginOption {
	/** Aliases from the tsconfig.json or jsconfig.json configuration. */
	const configAlias = getConfigAlias(settings);

	// if no config alias was found, bypass this plugin
	if (!configAlias) return {} as vite.PluginOption;

	return {
		name: 'astro:tsconfig-alias',
		enforce: 'pre',
		config() {
			return {
				resolve: {
					alias: configAlias
				}
			}
		},
	};
}
