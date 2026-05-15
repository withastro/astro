import fs from 'node:fs';
import path from 'node:path';
import { normalizePath } from 'vite';
const getConfigAlias = (settings) => {
	const { tsConfig, tsConfigPath } = settings;
	if (!tsConfig || !tsConfigPath || !tsConfig.compilerOptions) return null;
	const { baseUrl, paths } = tsConfig.compilerOptions;
	const effectiveBaseUrl = baseUrl ?? (paths ? '.' : void 0);
	if (!effectiveBaseUrl) return null;
	const resolvedBaseUrl = path.resolve(path.dirname(tsConfigPath), effectiveBaseUrl);
	const aliases = [];
	if (paths) {
		for (const [alias, values] of Object.entries(paths)) {
			const find = new RegExp(
				`^${[...alias]
					.map((segment) =>
						segment === '*' ? '(.+)' : segment.replace(/[\\^$*+?.()|[\]{}]/, '\\$&'),
					)
					.join('')}$`,
			);
			for (const value of values) {
				let matchId = 0;
				const replacement = [...normalizePath(path.resolve(resolvedBaseUrl, value))]
					.map((segment) => (segment === '*' ? `$${++matchId}` : segment === '$' ? '$$' : segment))
					.join('');
				aliases.push({ find, replacement });
			}
		}
	}
	if (baseUrl) {
		aliases.push({
			find: /^(?!\.*\/|\.*$|\w:)(.+)$/,
			replacement: `${[...normalizePath(resolvedBaseUrl)].map((segment) => (segment === '$' ? '$$' : segment)).join('')}/$1`,
		});
	}
	return aliases;
};
const getViteResolveAlias = (settings) => {
	const { tsConfig, tsConfigPath } = settings;
	if (!tsConfig || !tsConfigPath || !tsConfig.compilerOptions) return [];
	const { baseUrl, paths } = tsConfig.compilerOptions;
	const effectiveBaseUrl = baseUrl ?? (paths ? '.' : void 0);
	if (!effectiveBaseUrl) return [];
	const resolvedBaseUrl = path.resolve(path.dirname(tsConfigPath), effectiveBaseUrl);
	const aliases = [];
	if (paths) {
		for (const [aliasPattern, values] of Object.entries(paths)) {
			const resolvedValues = values.map((v) => path.resolve(resolvedBaseUrl, v));
			const customResolver = (id) => {
				for (const resolvedValue of resolvedValues) {
					const resolved = resolvedValue.replace('*', id);
					const stats = fs.statSync(resolved, { throwIfNoEntry: false });
					if (stats && stats.isFile()) {
						return normalizePath(resolved);
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
function configAliasVitePlugin({ settings }) {
	const configAlias = getConfigAlias(settings);
	if (!configAlias) return null;
	const plugin = {
		name: 'astro:tsconfig-alias',
		// use post to only resolve ids that all other plugins before it can't
		enforce: 'post',
		config() {
			return {
				resolve: {
					alias: getViteResolveAlias(settings),
				},
			};
		},
		resolveId: {
			filter: {
				id: {
					include: configAlias.map((alias) => alias.find),
					exclude: /(?:\0|^virtual:|^astro:)/,
				},
			},
			async handler(id, importer, options) {
				for (const alias of configAlias) {
					if (alias.find.test(id)) {
						const updatedId = id.replace(alias.find, alias.replacement);
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
export { configAliasVitePlugin as default };
