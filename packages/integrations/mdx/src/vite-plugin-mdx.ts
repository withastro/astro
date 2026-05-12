import { isUnifiedProcessor } from '@astrojs/markdown-remark';
import { isSatteriProcessor } from '@astrojs/markdown-satteri';
import type { SSRError } from 'astro';
import { getAstroMetadata } from 'astro/jsx/rehype.js';
import type { MarkdownProcessorEntry, MdxRenderer } from 'astro/markdown';
import { VFile } from 'vfile';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { createMdxProcessor as createRemarkMdxProcessor } from './plugins.js';
import { createMdxProcessor as createSatteriMdxProcessor } from './satteri-plugins.js';
import { safeParseFrontmatter } from './utils.js';

export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
	processor: MarkdownProcessorEntry;
}

// NOTE: Do not destructure `opts` as we're assigning a reference that will be mutated later
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	let mdxRenderer: MdxRenderer | undefined;
	let sourcemapEnabled: boolean;

	return {
		name: '@mdx-js/rolldown',
		enforce: 'pre',
		buildEnd() {
			mdxRenderer = undefined;
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
					if (!mdxRenderer) {
						mdxRenderer = await resolveMdxRenderer(opts, sourcemapEnabled);
					}
					const result = await mdxRenderer.process(content, id, frontmatter);
					return {
						code: result.code,
						map: result.map ?? null,
						meta: {
							astro: result.astroMetadata,
							vite: { lang: 'ts' },
						},
					};
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

async function resolveMdxRenderer(
	opts: VitePluginMdxOptions,
	sourcemap: boolean,
): Promise<MdxRenderer> {
	const { processor } = opts;

	// Third-party processors opt into MDX support by implementing createMdxRenderer themselves.
	if (processor.createMdxRenderer) {
		return processor.createMdxRenderer(
			{
				syntaxHighlight: opts.mdxOptions.syntaxHighlight,
				shikiConfig: opts.mdxOptions.shikiConfig,
				gfm: opts.mdxOptions.gfm,
				smartypants: opts.mdxOptions.smartypants,
			},
			{ optimize: opts.mdxOptions.optimize, recmaPlugins: opts.mdxOptions.recmaPlugins },
		);
	}

	if (isSatteriProcessor(processor)) {
		const satteriProcessor = createSatteriMdxProcessor(opts.mdxOptions);
		return {
			async process(content, filePath, frontmatter) {
				const result = await satteriProcessor.process(content, filePath, frontmatter);
				return { code: result.code, map: null, astroMetadata: result.astroMetadata };
			},
		};
	}
	if (isUnifiedProcessor(processor)) {
		const remarkProcessor = createRemarkMdxProcessor(opts.mdxOptions, { sourcemap });
		return {
			async process(content, filePath, frontmatter) {
				const vfile = new VFile({
					value: content,
					path: filePath,
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
					map: compiled.map ? JSON.stringify(compiled.map) : null,
					astroMetadata,
				};
			},
		};
	}

	throw new Error(
		`The markdown processor "${processor.name}" does not provide MDX support. ` +
			`Implement \`createMdxRenderer\` on the processor descriptor to enable MDX rendering.`,
	);
}
