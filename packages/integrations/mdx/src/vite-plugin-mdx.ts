import type { SSRError } from 'astro';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { createMdxProcessor } from './satteri-plugins.js';
import { safeParseFrontmatter } from './utils.js';

export interface VitePluginMdxOptions {
	mdxOptions: MdxOptions;
	srcDir: URL;
}

// NOTE: Do not destructure `opts` as we're assigning a reference that will be mutated later
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	let processor: ReturnType<typeof createMdxProcessor> | undefined;

	return {
		name: '@mdx-js/rollup',
		enforce: 'pre',
		buildEnd() {
			processor = undefined;
		},
		configResolved(resolved) {
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

				// Lazily initialize the MDX processor
				if (!processor) {
					processor = createMdxProcessor(opts.mdxOptions);
				}

				try {
					const result = await processor.process(content, id, frontmatter);

					return {
						code: result.code,
						map: null,
						meta: {
							astro: result.astroMetadata,
							vite: {
								// Setting this vite metadata to `ts` causes Vite to resolve .js
								// extensions to .ts files.
								lang: 'ts',
							},
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
