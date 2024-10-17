import babel from '@babel/core';
import type { TransformResult } from 'rollup';
import type { JSXTransformConfig } from '../@types/astro.js';
import { jsxTransformOptions } from '../jsx/transform-options.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { tagExportsPlugin } from './tag.js';

/**
 * @deprecated This function is no longer used. Remove in Astro 5.0
 */
export async function transformJSX(
	code: string,
	id: string,
	ssr?: boolean,
): Promise<TransformResult> {
	const options = await getJsxTransformOptions();
	const plugins = ssr ? [...(options.plugins ?? []), tagExportsPlugin] : options.plugins;

	const result = await babel.transformAsync(code, {
		presets: options.presets,
		plugins,
		cwd: process.cwd(),
		filename: id,
		ast: false,
		compact: false,
		sourceMaps: true,
		configFile: false,
		babelrc: false,
		browserslistConfigFile: false,
		inputSourceMap: options.inputSourceMap,
	});

	// TODO: Be more strict about bad return values here.
	// Should we throw an error instead? Should we never return `{code: ""}`?
	if (!result) return null;

	const { astro } = result.metadata as unknown as PluginMetadata;
	return {
		code: result.code || '',
		map: result.map,
		meta: {
			astro,
			vite: {
				// Setting this vite metadata to `ts` causes Vite to resolve .js
				// extensions to .ts files.
				lang: 'ts',
			},
		},
	};
}

let cachedJsxTransformOptions: Promise<JSXTransformConfig> | JSXTransformConfig | undefined;

/**
 * Get the `jsxTransformOptions` with caching
 */
async function getJsxTransformOptions(): Promise<JSXTransformConfig> {
	if (cachedJsxTransformOptions) {
		return cachedJsxTransformOptions;
	}

	const options = jsxTransformOptions();

	// Cache the promise
	cachedJsxTransformOptions = options;
	// After the promise is resolved, cache the final resolved options
	options.then((resolvedOptions) => {
		cachedJsxTransformOptions = resolvedOptions;
	});

	return options;
}
