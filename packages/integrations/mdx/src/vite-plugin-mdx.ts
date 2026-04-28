import type { SSRError } from 'astro';
import { getAstroMetadata } from 'astro/jsx/rehype.js';
import { VFile } from 'vfile';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { createMdxProcessor as createRemarkMdxProcessor } from './plugins.js';
import { createMdxProcessor as createSatteriMdxProcessor } from './satteri-plugins.js';
import { safeParseFrontmatter } from './utils.js';

export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
	nativeMarkdown?: boolean | {
		mdastPlugins?: import('satteri').MdastPluginDefinition[];
		hastPlugins?: import('satteri').HastPluginDefinition[];
		features?: import('satteri').Features;
	};
}

// NOTE: Do not destructure `opts` as we're assigning a reference that will be mutated later
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	let remarkProcessor: ReturnType<typeof createRemarkMdxProcessor> | undefined;
	let satteriProcessor: ReturnType<typeof createSatteriMdxProcessor> | undefined;
	let sourcemapEnabled: boolean;

	return {
		name: '@mdx-js/rollup',
		enforce: 'pre',
		buildEnd() {
			remarkProcessor = undefined;
			satteriProcessor = undefined;
		},
		configResolved(resolved) {
			sourcemapEnabled = !!resolved.build.sourcemap;

			// HACK: Remove the `astro:jsx` plugin if defined as we handle the JSX transformation ourselves
			const jsxPluginIndex = resolved.plugins.findIndex((p) => p.name === 'astro:jsx');
			if (jsxPluginIndex !== -1) {
				// @ts-ignore-error ignore readonly annotation
				resolved.plugins.splice(jsxPluginIndex, 1);
			}
		},
		resolveId: {
			filter: {
				// Do not match sources that start with /
				id: /^[^/]/,
			},
			async handler(source, importer, options) {
				if (importer?.endsWith('.mdx')) {
					let resolved = await this.resolve(source, importer, options);
					if (!resolved) resolved = await this.resolve('./' + source, importer, options);
					return resolved;
				}
			},
		},
		transform: {
			filter: {
				id: /\.mdx$/,
			},
			async handler(code, id) {
				const { frontmatter, content } = safeParseFrontmatter(code, id);

				try {
					if (opts.nativeMarkdown) {
						// Satteri (native) path
						if (!satteriProcessor) {
							satteriProcessor = createSatteriMdxProcessor(opts.mdxOptions);
						}
						const result = await satteriProcessor.process(content, id, frontmatter);
						return {
							code: result.code,
							map: null,
							meta: {
								astro: result.astroMetadata,
								vite: { lang: 'ts' },
							},
						};
					} else {
						// Remark/rehype (default) path
						if (!remarkProcessor) {
							remarkProcessor = createRemarkMdxProcessor(opts.mdxOptions, {
								sourcemap: sourcemapEnabled,
							});
						}
						const vfile = new VFile({
							value: content,
							path: id,
							data: {
								astro: { frontmatter },
								applyFrontmatterExport: { srcDir: opts.srcDir },
							},
						});
						const compiled = await remarkProcessor.process(vfile);
						const astroMetadata = getAstroMetadata(vfile);
						if (!astroMetadata) {
							throw new Error(
								'Internal MDX error: Astro metadata is not set by rehype-analyze-astro-metadata',
							);
						}
						return {
							code: String(compiled.value),
							map: compiled.map,
							meta: {
								astro: astroMetadata,
								vite: { lang: 'ts' },
							},
						};
					}
				} catch (e: any) {
					const err: SSRError = e;
					err.name = 'MDXError';
					err.loc = { file: id, line: e.line, column: e.column };
					Error.captureStackTrace(err);
					throw err;
				}
			},
		},
	};
}
