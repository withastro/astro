import type { TransformResult } from 'rollup';
import type { AstroRenderer } from '../@types/astro.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

import babel from '@babel/core';
import tagExportsPlugin from './tag.js';

interface TransformJSXOptions {
	code: string;
	id: string;
	mode: string;
	renderer: AstroRenderer;
	ssr: boolean;
	root: URL;
}

export async function transformJSX({
	code,
	mode,
	id,
	ssr,
	renderer,
	root,
}: TransformJSXOptions): Promise<TransformResult> {
	const { jsxTransformOptions } = renderer;
	const options = await jsxTransformOptions!({ mode, ssr });
	const plugins = [...(options.plugins || [])];
	if (ssr) {
		plugins.push(await tagExportsPlugin({ rendererName: renderer.name, root }));
	}
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
		inputSourceMap: options.inputSourceMap,
	});
	// TODO: Be more strict about bad return values here.
	// Should we throw an error instead? Should we never return `{code: ""}`?
	if (!result) return null;

	if (renderer.name === 'astro:jsx') {
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

	return {
		code: result.code || '',
		map: result.map,
	};
}
