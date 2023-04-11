import type { TransformResult } from 'rollup';
import {
	transformWithEsbuild,
	type EsbuildTransformOptions,
	type Plugin,
	type ResolvedConfig,
} from 'vite';
import type { AstroRenderer, AstroSettings } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata } from '../vite-plugin-astro/types';

import babel from '@babel/core';
import * as colors from 'kleur/colors';
import path from 'path';
import { error } from '../core/logger/core.js';
import { removeQueryString } from '../core/path.js';
import { detectImportSource } from './import-source.js';
import tagExportsPlugin from './tag.js';
import { CONTENT_FLAG, PROPAGATED_ASSET_FLAG } from '../content/index.js';

const JSX_EXTENSIONS = new Set(['.jsx', '.tsx', '.mdx']);
const IMPORT_STATEMENTS: Record<string, string> = {
	react: "import React from 'react'",
	preact: "import { h } from 'preact'",
	'solid-js': "import 'solid-js'",
	astro: "import 'astro/jsx-runtime'",
};

function getEsbuildLoader(filePath: string): EsbuildTransformOptions['loader'] {
	const fileExt = path.extname(filePath);
	if (fileExt === '.mdx') return 'jsx';
	return fileExt.slice(1) as EsbuildTransformOptions['loader'];
}

function collectJSXRenderers(renderers: AstroRenderer[]): Map<string, AstroRenderer> {
	const renderersWithJSXSupport = renderers.filter((r) => r.jsxImportSource);
	return new Map(
		renderersWithJSXSupport.map((r) => [r.jsxImportSource, r] as [string, AstroRenderer])
	);
}

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
	logging: LogOptions;
}

// Format inspired by https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts#L54
const SPECIAL_QUERY_REGEX = new RegExp(
	`[?&](?:worker|sharedworker|raw|url|${CONTENT_FLAG}|${PROPAGATED_ASSET_FLAG})\\b`
);

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function jsx({ settings, logging }: AstroPluginJSXOptions): Plugin {
	let viteConfig: ResolvedConfig;
	const jsxRenderers = new Map<string, AstroRenderer>();
	const jsxRenderersIntegrationOnly = new Map<string, AstroRenderer>();
	// A reference to Astro's internal JSX renderer.
	let astroJSXRenderer: AstroRenderer;
	// The first JSX renderer provided is considered the default renderer.
	// This is a useful reference for when the user only gives a single render.
	let defaultJSXRendererEntry: [string, AstroRenderer] | undefined;

	return {
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
		async configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
			const possibleRenderers = collectJSXRenderers(settings.renderers);
			for (const [importSource, renderer] of possibleRenderers) {
				jsxRenderers.set(importSource, renderer);
				if (importSource === 'astro') {
					astroJSXRenderer = renderer;
				} else {
					jsxRenderersIntegrationOnly.set(importSource, renderer);
				}
			}
			defaultJSXRendererEntry = [...jsxRenderersIntegrationOnly.entries()][0];
		},
		async transform(code, id, opts) {
			const ssr = Boolean(opts?.ssr);
			if (SPECIAL_QUERY_REGEX.test(id)) {
				return null;
			}
			id = removeQueryString(id);
			if (!JSX_EXTENSIONS.has(path.extname(id))) {
				return null;
			}

			const { mode } = viteConfig;
			// Shortcut: only use Astro renderer for MD and MDX files
			if (id.endsWith('.mdx')) {
				const { code: jsxCode } = await transformWithEsbuild(code, id, {
					loader: getEsbuildLoader(id),
					jsx: 'preserve',
					sourcemap: 'inline',
					tsconfigRaw: {
						compilerOptions: {
							// Ensure client:only imports are treeshaken
							importsNotUsedAsValues: 'remove',
						},
					},
				});
				return transformJSX({
					code: jsxCode,
					id,
					renderer: astroJSXRenderer,
					mode,
					ssr,
					root: settings.config.root,
				});
			}
			if (defaultJSXRendererEntry && jsxRenderersIntegrationOnly.size === 1) {
				// downlevel any non-standard syntax, but preserve JSX
				const { code: jsxCode } = await transformWithEsbuild(code, id, {
					loader: getEsbuildLoader(id),
					jsx: 'preserve',
					sourcemap: 'inline',
				});
				return transformJSX({
					code: jsxCode,
					id,
					renderer: defaultJSXRendererEntry[1],
					mode,
					ssr,
					root: settings.config.root,
				});
			}

			const importSource = await detectImportSource(code, jsxRenderers, settings.tsConfig);

			// if we still can’t tell the import source, now is the time to throw an error.
			if (!importSource && defaultJSXRendererEntry) {
				const [defaultRendererName] = defaultJSXRendererEntry;
				error(
					logging,
					'renderer',
					`${colors.yellow(id)}
Unable to resolve a renderer that handles this file! With more than one renderer enabled, you should include an import or use a pragma comment.
Add ${colors.cyan(
						IMPORT_STATEMENTS[defaultRendererName] || `import '${defaultRendererName}';`
					)} or ${colors.cyan(`/* jsxImportSource: ${defaultRendererName} */`)} to this file.
`
				);
				return null;
			} else if (!importSource) {
				error(
					logging,
					'renderer',
					`${colors.yellow(id)}
Unable to find a renderer for JSX. Do you have one configured in your Astro config? See this page to learn how:
https://docs.astro.build/en/core-concepts/framework-components/#installing-integrations
`
				);
				return null;
			}

			const selectedJsxRenderer = jsxRenderers.get(importSource);
			// if the renderer is not installed for this JSX source, throw error
			if (!selectedJsxRenderer) {
				error(
					logging,
					'renderer',
					`${colors.yellow(
						id
					)} No renderer installed for ${importSource}. Try adding \`@astrojs/${importSource}\` to your project.`
				);
				return null;
			}

			// downlevel any non-standard syntax, but preserve JSX
			const { code: jsxCode } = await transformWithEsbuild(code, id, {
				loader: getEsbuildLoader(id),
				jsx: 'preserve',
				sourcemap: 'inline',
			});
			return await transformJSX({
				code: jsxCode,
				id,
				renderer: selectedJsxRenderer,
				mode,
				ssr,
				root: settings.config.root,
			});
		},
	};
}
