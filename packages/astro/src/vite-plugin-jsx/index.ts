import type { TransformResult } from 'rollup';
import type { Plugin, ResolvedConfig } from 'vite';
import type { AstroConfig, Renderer } from '../@types/astro';
import type { LogOptions } from '../core/logger.js';

import babel from '@babel/core';
import esbuild from 'esbuild';
import * as colors from 'kleur/colors';
import * as eslexer from 'es-module-lexer';
import path from 'path';
import { error } from '../core/logger.js';
import { parseNpmName, resolveDependency } from '../core/util.js';

const JSX_RENDERER_CACHE = new WeakMap<AstroConfig, Map<string, Renderer>>();
const JSX_EXTENSIONS = new Set(['.jsx', '.tsx']);
const IMPORT_STATEMENTS: Record<string, string> = {
	react: "import React from 'react'",
	preact: "import { h } from 'preact'",
	'solid-js': "import 'solid-js/web'",
};

// A code snippet to inject into JS files to prevent esbuild reference bugs.
// The `tsx` loader in esbuild will remove unused imports, so we need to
// be careful about esbuild not treating h, React, Fragment, etc. as unused.
const PREVENT_UNUSED_IMPORTS = ';;(React,Fragment,h);';

function getEsbuildLoader(fileExt: string): string {
	return fileExt.substr(1);
}

async function importJSXRenderers(config: AstroConfig): Promise<Map<string, Renderer>> {
	const renderers = new Map<string, Renderer>();
	await Promise.all(
		config.renderers.map((name) => {
			return import(resolveDependency(name, config)).then(({ default: renderer }) => {
				if (!renderer.jsxImportSource) return;
				renderers.set(renderer.jsxImportSource, renderer);
			});
		})
	);
	return renderers;
}

interface TransformJSXOptions {
	code: string;
	id: string;
	mode: string;
	renderer: Renderer;
	ssr: boolean;
}

async function transformJSX({ code, mode, id, ssr, renderer }: TransformJSXOptions): Promise<TransformResult> {
	const { jsxTransformOptions } = renderer;
	const options = await jsxTransformOptions!({ mode, ssr });
	const plugins = [...(options.plugins || [])];
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
	});
	// TODO: Be more strict about bad return values here.
	// Should we throw an error instead? Should we never return `{code: ""}`?
	if (!result) return null;
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
				const possibleRenderers = await importJSXRenderers(config);
				if (possibleRenderers.size === 0) {
					// note: we have filtered out all non-JSX files, so this error should only show if a JSX file is loaded with no matching renderers
					throw new Error(
						`${colors.yellow(
							id
						)}\nUnable to resolve a renderer that handles JSX transforms! Please include a \`renderer\` plugin which supports JSX in your \`astro.config.mjs\` file.`
					);
				}
				for (const [importSource, renderer] of possibleRenderers) {
					jsxRenderers.set(importSource, renderer);
				}
				JSX_RENDERER_CACHE.set(config, jsxRenderers);
			}

			// Attempt: Single JSX renderer
			// If we only have one renderer, we can skip a bunch of work!
			if (jsxRenderers.size === 1) {
				// downlevel any non-standard syntax, but preserve JSX
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return transformJSX({ code: jsxCode, id, renderer: [...jsxRenderers.values()][0], mode, ssr });
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
				const multiline = code.match(/\/\*\*[\S\s]*\*\//gm) || [];
				for (const comment of multiline) {
					const [_, lib] = comment.match(/@jsxImportSource\s*(\S+)/) || [];
					if (lib) {
						importSource = lib;
						break;
					}
				}
			}

			// if JSX renderer found, then use that
			if (importSource) {
				const jsxRenderer = jsxRenderers.get(importSource);
				// if renderer not installed for this JSX source, throw error
				if (!jsxRenderer) {
					error(logging, 'renderer', `${colors.yellow(id)} No renderer installed for ${importSource}. Try adding \`@astrojs/renderer-${importSource}\` to your dependencies.`);
					return null;
				}
				// downlevel any non-standard syntax, but preserve JSX
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return await transformJSX({ code: jsxCode, id, renderer: jsxRenderers.get(importSource) as Renderer, mode, ssr });
			}

			// if we still can’t tell, throw error
			const defaultRenderer = [...jsxRenderers.keys()][0];
			error(
				logging,
				'renderer',
				`${colors.yellow(id)}
Unable to resolve a renderer that handles this file! With more than one renderer enabled, you should include an import or use a pragma comment.
Add ${colors.cyan(IMPORT_STATEMENTS[defaultRenderer] || `import '${defaultRenderer}';`)} or ${colors.cyan(`/* jsxImportSource: ${defaultRenderer} */`)} to this file.
`
			);
			return null;
		},
	};
}
