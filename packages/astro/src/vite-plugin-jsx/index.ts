import type { TransformResult } from 'rollup';
import type { Plugin, ResolvedConfig } from 'vite';
import type { AstroConfig, AstroRenderer } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata } from '../vite-plugin-astro/types';

import babel from '@babel/core';
import * as eslexer from 'es-module-lexer';
import esbuild from 'esbuild';
import * as colors from 'kleur/colors';
import path from 'path';
import { error } from '../core/logger/core.js';
import { parseNpmName } from '../core/util.js';
import tagExportsPlugin from './tag.js';

const JSX_RENDERER_CACHE = new WeakMap<AstroConfig, Map<string, AstroRenderer>>();
const JSX_EXTENSIONS = new Set(['.jsx', '.tsx', '.mdx']);
const IMPORT_STATEMENTS: Record<string, string> = {
	react: "import React from 'react'",
	preact: "import { h } from 'preact'",
	'solid-js': "import 'solid-js'",
	astro: "import 'astro/jsx-runtime'",
};

// A code snippet to inject into JS files to prevent esbuild reference bugs.
// The `tsx` loader in esbuild will remove unused imports, so we need to
// be careful about esbuild not treating h, React, Fragment, etc. as unused.
const PREVENT_UNUSED_IMPORTS = ';;(React,Fragment,h);';

function getEsbuildLoader(fileExt: string): string {
	if (fileExt === '.mdx') return 'jsx';
	return fileExt.slice(1);
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
}

async function transformJSX({
	code,
	mode,
	id,
	ssr,
	renderer,
}: TransformJSXOptions): Promise<TransformResult> {
	const { jsxTransformOptions } = renderer;
	const options = await jsxTransformOptions!({ mode, ssr });
	const plugins = [...(options.plugins || []), tagExportsPlugin({ rendererName: renderer.name })];
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
	config: AstroConfig;
	logging: LogOptions;
}

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function jsx({ config, logging }: AstroPluginJSXOptions): Plugin {
	let viteConfig: ResolvedConfig;

	return {
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
		configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
		},
		async transform(code, id, opts) {
			const ssr = Boolean(opts?.ssr);
			if (!JSX_EXTENSIONS.has(path.extname(id))) {
				return null;
			}

			const { mode } = viteConfig;
			let jsxRenderers = JSX_RENDERER_CACHE.get(config);

			// load renderers (on first run only)
			if (!jsxRenderers) {
				jsxRenderers = new Map();
				const possibleRenderers = await collectJSXRenderers(config._ctx.renderers);
				if (possibleRenderers.size === 0) {
					// note: we have filtered out all non-JSX files, so this error should only show if a JSX file is loaded with no matching renderers
					throw new Error(
						`${colors.yellow(
							id
						)}\nUnable to resolve a JSX renderer! Did you forget to include one? Add a JSX integration like \`@astrojs/react\` to your \`astro.config.mjs\` file.`
					);
				}
				for (const [importSource, renderer] of possibleRenderers) {
					jsxRenderers.set(importSource, renderer);
				}
				JSX_RENDERER_CACHE.set(config, jsxRenderers);
			}

			const astroRenderer = jsxRenderers.get('astro');

			// Shortcut: only use Astro renderer for MD and MDX files
			if ((id.includes('.mdx') || id.includes('.md')) && astroRenderer) {
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return transformJSX({
					code: jsxCode,
					id,
					renderer: astroRenderer,
					mode,
					ssr,
				});
			}

			// Attempt: Single JSX integration
			// If we only have one renderer, we can skip a bunch of work!
			const nonAstroJsxRenderers = new Map(
				[...jsxRenderers.entries()].filter(([key]) => key !== 'astro')
			);
			if (nonAstroJsxRenderers.size === 1) {
				// downlevel any non-standard syntax, but preserve JSX
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return transformJSX({
					code: jsxCode,
					id,
					renderer: [...nonAstroJsxRenderers.values()][0],
					mode,
					ssr,
				});
			}

			// Attempt: Multiple JSX renderers
			// we need valid JS to scan, so we can use `h` and `Fragment` as placeholders
			const { code: jsCode } = await esbuild.transform(code + PREVENT_UNUSED_IMPORTS, {
				loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
				jsx: 'transform',
				jsxFactory: 'h',
				jsxFragment: 'Fragment',
				sourcefile: id,
				sourcemap: 'inline',
			});

			let imports: eslexer.ImportSpecifier[] = [];
			if (/import/.test(jsCode)) {
				let [i] = eslexer.parse(jsCode);
				imports = i as any;
			}
			let importSource: string | undefined;
			if (imports.length > 0) {
				for (let { n: spec } of imports) {
					const pkg = spec && parseNpmName(spec);
					if (!pkg) continue;
					if (jsxRenderers.has(pkg.name)) {
						importSource = pkg.name;
						break;
					}
				}
			}

			// if no imports were found, look for @jsxImportSource comment
			if (!importSource) {
				const multiline = code.match(/\/\*\*?[\S\s]*\*\//gm) || [];
				for (const comment of multiline) {
					const [_, lib] = comment.slice(0, -2).match(/@jsxImportSource\s*(\S+)/) || [];
					if (lib) {
						importSource = lib.trim();
						break;
					}
				}
			}

			// if JSX renderer found, then use that
			if (importSource) {
				const jsxRenderer = jsxRenderers.get(importSource);
				// if renderer not installed for this JSX source, throw error
				if (!jsxRenderer) {
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
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return await transformJSX({
					code: jsxCode,
					id,
					renderer: jsxRenderers.get(importSource) as AstroRenderer,
					mode,
					ssr,
				});
			}

			// if we still can’t tell, throw error
			const defaultRenderer = [...jsxRenderers.keys()][0];
			error(
				logging,
				'renderer',
				`${colors.yellow(id)}
Unable to resolve a renderer that handles this file! With more than one renderer enabled, you should include an import or use a pragma comment.
Add ${colors.cyan(
					IMPORT_STATEMENTS[defaultRenderer] || `import '${defaultRenderer}';`
				)} or ${colors.cyan(`/* jsxImportSource: ${defaultRenderer} */`)} to this file.
`
			);
			return null;
		},
	};
}
