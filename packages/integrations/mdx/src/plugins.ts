import {
	rehypeHeadingIds,
	rehypePrism,
	rehypeShiki,
	remarkCollectImages,
} from '@astrojs/markdown-remark';
import { createProcessor, nodeTypes } from '@mdx-js/mdx';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { rehypeAnalyzeAstroMetadata } from 'astro/jsx/rehype.js';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { SourceMapGenerator } from 'source-map';
import type { PluggableList } from 'unified';
import { routeToCompiler } from './compiler-router.js';
import type { MdxOptions } from './index.js';
import { rehypeApplyFrontmatterExport } from './rehype-apply-frontmatter-export.js';
import { rehypeInjectHeadingsExport } from './rehype-collect-headings.js';
import { rehypeImageToComponent } from './rehype-images-to-component.js';
import rehypeMetaString from './rehype-meta-string.js';
import { rehypeOptimizeStatic } from './rehype-optimize-static.js';

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

interface MdxProcessorExtraOptions {
	sourcemap: boolean;
	experimentalHeadingIdCompat: boolean;
	config?: AstroConfig;
	logger?: AstroIntegrationLogger;
}

export async function createMdxProcessor(
	mdxOptions: MdxOptions,
	extraOptions: MdxProcessorExtraOptions,
) {
	// Get the compiler mode from experimental config
	const mode = (extraOptions.config?.experimental as any)?.mdxCompiler ?? 'js';

	// If using 'rs' mode, route to the Rust-powered AST bridge
	if (mode === 'rs' && extraOptions.logger) {
		// Pass options directly for Rust mode - let router decide about plugins
		const fullMdxOptions = {
			...mdxOptions,
			remarkPlugins: mdxOptions.disableDefaultPlugins ? [] : getRemarkPlugins(mdxOptions),
			rehypePlugins: mdxOptions.disableDefaultPlugins
				? []
				: getRehypePlugins(mdxOptions, extraOptions),
			development: process.env.NODE_ENV !== 'production',
		};

		return routeToCompiler(fullMdxOptions, mode, extraOptions.logger);
	}

	// Default to standard JS processor for backward compatibility
	return createProcessor({
		remarkPlugins: getRemarkPlugins(mdxOptions),
		rehypePlugins: getRehypePlugins(mdxOptions, extraOptions),
		recmaPlugins: mdxOptions.recmaPlugins,
		remarkRehypeOptions: mdxOptions.remarkRehype,
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

	remarkPlugins.push(...mdxOptions.remarkPlugins);

	// Only add default Astro plugins if not explicitly disabled
	if (!mdxOptions.disableDefaultPlugins) {
		remarkPlugins.push(remarkCollectImages);
	}

	return remarkPlugins;
}

function getRehypePlugins(
	mdxOptions: MdxOptions,
	{ experimentalHeadingIdCompat }: MdxProcessorExtraOptions,
): PluggableList {
	let rehypePlugins: PluggableList = [];

	// Only add default plugins if not explicitly disabled
	if (!mdxOptions.disableDefaultPlugins) {
		rehypePlugins.push(
			// ensure `data.meta` is preserved in `properties.metastring` for rehype syntax highlighters
			rehypeMetaString,
			// rehypeRaw allows custom syntax highlighters to work without added config
			[rehypeRaw, { passThrough: nodeTypes }],
		);
	}

	const syntaxHighlight = mdxOptions.syntaxHighlight;
	if (syntaxHighlight && !isPerformanceBenchmark) {
		const syntaxHighlightType =
			typeof syntaxHighlight === 'string' ? syntaxHighlight : syntaxHighlight?.type;
		const excludeLangs =
			typeof syntaxHighlight === 'object' ? syntaxHighlight?.excludeLangs : undefined;
		// Apply syntax highlighters after user plugins to match `markdown/remark` behavior
		if (syntaxHighlightType === 'shiki') {
			rehypePlugins.push([rehypeShiki, mdxOptions.shikiConfig, excludeLangs]);
		} else if (syntaxHighlightType === 'prism') {
			rehypePlugins.push([rehypePrism, excludeLangs]);
		}
	}

	rehypePlugins.push(...mdxOptions.rehypePlugins);

	// Only add default image component if not disabled
	if (!mdxOptions.disableDefaultPlugins) {
		rehypePlugins.push(rehypeImageToComponent);
	}

	if (!isPerformanceBenchmark && !mdxOptions.disableDefaultPlugins) {
		// getHeadings() is guaranteed by TS, so this must be included.
		// We run `rehypeHeadingIds` _last_ to respect any custom IDs set by user plugins.
		rehypePlugins.push(
			[rehypeHeadingIds, { experimentalHeadingIdCompat }],
			rehypeInjectHeadingsExport,
		);
	}

	// These are essential for Astro to work, only skip if explicitly disabled
	if (!mdxOptions.disableDefaultPlugins) {
		rehypePlugins.push(
			// Render info from `vfile.data.astro.frontmatter` as JS
			rehypeApplyFrontmatterExport,
			// Analyze MDX nodes and attach to `vfile.data.__astroMetadata`
			rehypeAnalyzeAstroMetadata,
		);
	}

	if (mdxOptions.optimize) {
		// Convert user `optimize` option to compatible `rehypeOptimizeStatic` option
		const options = mdxOptions.optimize === true ? undefined : mdxOptions.optimize;
		rehypePlugins.push([rehypeOptimizeStatic, options]);
	}

	return rehypePlugins;
}
