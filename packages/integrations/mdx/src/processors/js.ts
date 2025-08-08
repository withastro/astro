import { createProcessor } from '@mdx-js/mdx';
import { SourceMapGenerator } from 'source-map';
import type { VFile } from 'vfile';
import type { MdxOptions } from '../index.js';

interface ProcessorOptions {
	sourcemap?: boolean;
	experimentalHeadingIdCompat?: boolean;
}

/**
 * Creates a standard JavaScript MDX processor using @mdx-js/mdx
 */
export function createJSProcessor(mdxOptions: MdxOptions, extraOptions: ProcessorOptions = {}) {
	const processor = createProcessor({
		remarkPlugins: mdxOptions.remarkPlugins,
		rehypePlugins: mdxOptions.rehypePlugins,
		recmaPlugins: mdxOptions.recmaPlugins,
		remarkRehypeOptions: mdxOptions.remarkRehype,
		jsxImportSource: 'astro',
		// Note: disable `.md` (and other alternative extensions for markdown files like `.markdown`) support
		format: 'mdx',
		mdExtensions: [],
		elementAttributeNameCase: 'html',
		SourceMapGenerator: extraOptions.sourcemap ? SourceMapGenerator : undefined,
		development: mdxOptions.development,
	});

	return {
		async process(vfile: VFile) {
			const result = await processor.process(vfile);
			return {
				value: result.value,
				map: result.map ?? null, // Always return map or null for Vite
				data: result.data,
			};
		},
	};
}
