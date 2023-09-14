import type { TransformResult } from 'rollup';
import { transformWithEsbuild, type Plugin, type ResolvedConfig } from 'vite';
import type { AstroRenderer, AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

import babel from '@babel/core';
import { CONTENT_FLAG, PROPAGATED_ASSET_FLAG } from '../content/index.js';
import { astroEntryPrefix } from '../core/build/plugins/plugin-component-entry.js';
import { removeQueryString } from '../core/path.js';
import tagExportsPlugin from './tag.js';

interface TransformJSXOptions {
	code: string;
	id: string;
	mode: string;
	renderer: AstroRenderer;
	ssr: boolean;
	root: URL;
}

async function transformJSX({
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

interface AstroPluginJSXOptions {
	settings: AstroSettings;
	logger: Logger;
}

// Format inspired by https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts#L54
const SPECIAL_QUERY_REGEX = new RegExp(
	`[?&](?:worker|sharedworker|raw|url|${CONTENT_FLAG}|${PROPAGATED_ASSET_FLAG})\\b`
);

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function mdxVitePlugin({ settings }: AstroPluginJSXOptions): Plugin {
	let viteConfig: ResolvedConfig;
	// A reference to Astro's internal JSX renderer.
	let astroJSXRenderer: AstroRenderer;

	return {
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
		async configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
			astroJSXRenderer = settings.renderers.find((r) => r.jsxImportSource === 'astro')!;
		},
		async transform(code, id, opts) {
			// Skip special queries and astro entries. We skip astro entries here as we know it doesn't contain
			// JSX code, and also because we can't detect the import source to apply JSX transforms.
			if (SPECIAL_QUERY_REGEX.test(id) || id.startsWith(astroEntryPrefix)) {
				return null;
			}
			id = removeQueryString(id);
			// Shortcut: only use Astro renderer for MD and MDX files
			if (!id.endsWith('.mdx')) {
				return null;
			}
			const { code: jsxCode } = await transformWithEsbuild(code, id, {
				loader: 'jsx',
				jsx: 'preserve',
				sourcemap: 'inline',
				tsconfigRaw: {
					compilerOptions: {
						// Ensure client:only imports are treeshaken
						verbatimModuleSyntax: false,
						importsNotUsedAsValues: 'remove',
					},
				},
			});
			return transformJSX({
				code: jsxCode,
				id,
				renderer: astroJSXRenderer,
				mode: viteConfig.mode,
				ssr: Boolean(opts?.ssr),
				root: settings.config.root,
			});
		},
	};
}
