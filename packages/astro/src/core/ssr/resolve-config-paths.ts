import { tsconfigResolverSync, TsConfigResultSuccess } from 'tsconfig-resolver';
import fs from 'fs'
import path from 'path'
import type * as vite from 'vite'

/** Return the nearest tsconfig.json or jsconfig.json configuration result. */
const getConfigResult = (): TsConfigResultSuccess | null => {
	/** Closest tsconfig.json */
	const tsConfig = tsconfigResolverSync({ searchName: 'tsconfig.json' })

	// return tsconfig.json, if it exists
	if (tsConfig.exists) return tsConfig

	/** Closest jsconfig.json */
	const jsConfig = tsconfigResolverSync({ searchName: 'jsconfig.json' })

	// return jsconfig.json, if it exists
	if (jsConfig.exists) return jsConfig

	// return null if no config exists
	return null
}

/** Return the resolvers from the tsconfig.json or jsconfig.json configuration. */
const getConfigResolver = (): { baseUrl: string, paths: { [alias: string]: string[] } } | null => {
	/** Configuration result */
	const configResult = getConfigResult()

	if (configResult && configResult.config.compilerOptions?.baseUrl) {
		let { baseUrl, paths } = configResult.config.compilerOptions as {
			baseUrl: string
			paths: {
				[key: string]: string[];
			}
		}

		// resolve the base url from the configuration file directory
		baseUrl = path.posix.resolve(path.posix.dirname(configResult.path), baseUrl)

		// sanitize and resolve all aliases from the configuration file directory
		for (let [ alias, values ] of Object.entries(Object(paths))) {
			delete paths[alias]

			paths[alias.replace(/\*$/, '')] = values = [].concat(values as any).map(
				(value: string) => path.posix.resolve(baseUrl, value).replace(/\*$/, '')
			)
		}

		return { baseUrl, paths }
	}

	return null
}

export default function resolveConfigPaths(): vite.PluginOption {
	/** Resolver from the tsconfig.json or jsconfig.json configuration. */
	const resolver = getConfigResolver()

	if (!resolver) return {} as vite.PluginOption

	return {
		name: '@astrojs/vite-plugin-tsconfig-alias',
		enforce: 'pre',
		resolveId(source: string): string | null {
			// conditionally resolve from each alias
			for (let [ alias, values ] of Object.entries(resolver.paths)) {
				if (source.startsWith(alias)) {
					for (const value of values) {
						const resolvedSource = source.replace(alias, value)

						if (fs.existsSync(resolvedSource)) {
							return resolvedSource
						}
					}
				}
			}

			// otherwise, conditionally resolve from the baseUrl

			const resolvedSource = path.posix.resolve(resolver.baseUrl, source)

			if (fs.existsSync(resolvedSource)) {
				return resolvedSource
			}

			// otherwise, continue resolving elsewhere

			return null
		}
	}
}
