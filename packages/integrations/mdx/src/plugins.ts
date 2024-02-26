import {
	rehypeHeadingIds,
	rehypePrism,
	rehypeShiki,
	remarkCollectImages,
} from '@astrojs/markdown-remark';
import { createProcessor, nodeTypes } from '@mdx-js/mdx';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { SourceMapGenerator } from 'source-map';
import type { PluggableList } from 'unified';
import type { MdxOptions } from './index.js';
import { recmaInjectImportMetaEnv } from './recma-inject-import-meta-env.js';
import { rehypeApplyFrontmatterExport } from './rehype-apply-frontmatter-export.js';
import { rehypeInjectHeadingsExport } from './rehype-collect-headings.js';
import rehypeMetaString from './rehype-meta-string.js';
import { rehypeOptimizeStatic } from './rehype-optimize-static.js';
import { remarkImageToComponent } from './remark-images-to-component.js';

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

interface MdxProcessorExtraOptions {
	sourcemap: boolean;
	importMetaEnv: Record<string, any>;
}

export function createMdxProcessor(mdxOptions: MdxOptions, extraOptions: MdxProcessorExtraOptions) {
	return createProcessor({
		remarkPlugins: getRemarkPlugins(mdxOptions),
		rehypePlugins: getRehypePlugins(mdxOptions),
		recmaPlugins: getRecmaPlugins(mdxOptions, extraOptions.importMetaEnv),
		remarkRehypeOptions: mdxOptions.remarkRehype,
		jsx: true,
		jsxImportSource: 'astro',
		// Note: disable `.md` (and other alternative extensions for markdown files like `.markdown`) support
		format: 'mdx',
		mdExtensions: [],
		elementAttributeNameCase: 'html',
		SourceMapGenerator: extraOptions.sourcemap ? SourceMapGenerator : undefined,
	});
}

function getRemarkPlugins(mdxOptions: MdxOptions): PluggableList {
	let remarkPlugins: PluggableList = [];

	if (!isPerformanceBenchmark) {
		if (mdxOptions.gfm) {
			remarkPlugins.push(remarkGfm);
		}
		if (mdxOptions.smartypants) {
			remarkPlugins.push(remarkSmartypants);
		}
	}

	remarkPlugins.push(...mdxOptions.remarkPlugins, remarkCollectImages, remarkImageToComponent);

	return remarkPlugins;
}

function getRehypePlugins(mdxOptions: MdxOptions): PluggableList {
	let rehypePlugins: PluggableList = [
		// ensure `data.meta` is preserved in `properties.metastring` for rehype syntax highlighters
		rehypeMetaString,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }],
	];

	if (!isPerformanceBenchmark) {
		// Apply syntax highlighters after user plugins to match `markdown/remark` behavior
		if (mdxOptions.syntaxHighlight === 'shiki') {
			rehypePlugins.push([rehypeShiki, mdxOptions.shikiConfig]);
		} else if (mdxOptions.syntaxHighlight === 'prism') {
			rehypePlugins.push(rehypePrism);
		}
	}

	rehypePlugins.push(...mdxOptions.rehypePlugins);

	if (!isPerformanceBenchmark) {
		// getHeadings() is guaranteed by TS, so this must be included.
		// We run `rehypeHeadingIds` _last_ to respect any custom IDs set by user plugins.
		rehypePlugins.push(rehypeHeadingIds, rehypeInjectHeadingsExport);
	}

	// computed from `astro.data.frontmatter` in VFile data
	rehypePlugins.push(rehypeApplyFrontmatterExport);

	if (mdxOptions.optimize) {
		// Convert user `optimize` option to compatible `rehypeOptimizeStatic` option
		const options = mdxOptions.optimize === true ? undefined : mdxOptions.optimize;
		rehypePlugins.push([rehypeOptimizeStatic, options]);
	}

	return rehypePlugins;
}

function getRecmaPlugins(
	mdxOptions: MdxOptions,
	importMetaEnv: Record<string, any>
): PluggableList {
	return [...(mdxOptions.recmaPlugins ?? []), [recmaInjectImportMetaEnv, { importMetaEnv }]];
}
