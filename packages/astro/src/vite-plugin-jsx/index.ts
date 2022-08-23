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
// A fast check regex for the import keyword. False positives are okay.
const IMPORT_KEYWORD_REGEX = /import/;

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

/**
 * Scan a file for an explicit @jsxImportSource comment.
 * If one is found, return it's value. Otherwise, return undefined.
 */
function detectImportSourceFromComments(code: string): string | undefined {
	// if no imports were found, look for @jsxImportSource comment
	const multiline = code.match(/\/\*\*?[\S\s]*\*\//gm) || [];
	for (const comment of multiline) {
		const [_, lib] = comment.slice(0, -2).match(/@jsxImportSource\s*(\S+)/) || [];
		if (lib) {
			return lib.trim();
		}
	}
}

/**
 * Scan a file's imports to detect which renderer it may need.
 * ex: if the file imports "preact", it's safe to assume the
 * component should be built as a Preact component.
 * If no relevant imports found, return undefined.
 */
async function detectImportSourceFromImports(
	code: string,
	id: string,
	jsxRenderers: Map<string, AstroRenderer>
) {
	// We need valid JS to scan for imports.
	// NOTE: Because we only need imports, it is okay to use `h` and `Fragment` as placeholders.
	const { code: jsCode } = await esbuild.transform(code + PREVENT_UNUSED_IMPORTS, {
		loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
		jsx: 'transform',
		jsxFactory: 'h',
		jsxFragment: 'Fragment',
		sourcefile: id,
		sourcemap: 'inline',
	});
	const [imports] = eslexer.parse(jsCode);
	if (imports.length > 0) {
		for (let { n: spec } of imports) {
			const pkg = spec && parseNpmName(spec);
			if (!pkg) continue;
			if (jsxRenderers.has(pkg.name)) {
				return pkg.name;
			}
		}
	}
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
	const plugins = [...(options.plugins || [])];
	if (ssr) {
		plugins.push(tagExportsPlugin({ rendererName: renderer.name }));
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
	config: AstroConfig;
	logging: LogOptions;
}

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function jsx({ config, logging }: AstroPluginJSXOptions): Plugin {
	let viteConfig: ResolvedConfig;
	const jsxRenderers = new Map<string, AstroRenderer>();
	const jsxRenderersIntegrationOnly = new Map<string, AstroRenderer>();
	// A reference to Astro's internal JSX renderer.
	let astroJSXRenderer: AstroRenderer;
	// The first JSX renderer provided is considered the default renderer.
	// This is a useful reference for when the user only gives a single render.
	let defaultJSXRendererEntry: [string, AstroRenderer];

	return {
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
		async configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
			const possibleRenderers = await collectJSXRenderers(config._ctx.renderers);
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
			if (!JSX_EXTENSIONS.has(path.extname(id))) {
				return null;
			}

			const { mode } = viteConfig;
			// Shortcut: only use Astro renderer for MD and MDX files
			if (id.includes('.mdx') || id.includes('.md')) {
				const { code: jsxCode } = await esbuild.transform(code, {
					loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
					jsx: 'preserve',
					sourcefile: id,
					sourcemap: 'inline',
				});
				return transformJSX({
					code: jsxCode,
					id,
					renderer: astroJSXRenderer,
					mode,
					ssr,
				});
			}
			if (defaultJSXRendererEntry && jsxRenderersIntegrationOnly.size === 1) {
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
					renderer: defaultJSXRendererEntry[1],
					mode,
					ssr,
				});
			}

			let importSource = detectImportSourceFromComments(code);
			if (!importSource && IMPORT_KEYWORD_REGEX.test(code)) {
				importSource = await detectImportSourceFromImports(code, id, jsxRenderers);
			}

			// if we still can’t tell the import source, now is the time to throw an error.
			if (!importSource) {
				const [defaultRendererName] = defaultJSXRendererEntry[0];
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
			const { code: jsxCode } = await esbuild.transform(code, {
				loader: getEsbuildLoader(path.extname(id)) as esbuild.Loader,
				jsx: 'preserve',
				sourcefile: id,
				sourcemap: 'inline',
			});
			return await transformJSX({
				code: jsxCode,
				id,
				renderer: selectedJsxRenderer,
				mode,
				ssr,
			});
		},
	};
}
