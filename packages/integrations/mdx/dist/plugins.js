import {
	rehypeHeadingIds,
	rehypePrism,
	rehypeShiki,
	remarkCollectImages,
} from '@astrojs/markdown-remark';
import { createProcessor, nodeTypes } from '@mdx-js/mdx';
import { rehypeAnalyzeAstroMetadata } from 'astro/jsx/rehype.js';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { SourceMapGenerator } from 'source-map';
import { rehypeApplyFrontmatterExport } from './rehype-apply-frontmatter-export.js';
import { rehypeInjectHeadingsExport } from './rehype-collect-headings.js';
import { rehypeImageToComponent } from './rehype-images-to-component.js';
import rehypeMetaString from './rehype-meta-string.js';
import { rehypeOptimizeStatic } from './rehype-optimize-static.js';
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);
function createMdxProcessor(mdxOptions, extraOptions) {
	return createProcessor({
		remarkPlugins: getRemarkPlugins(mdxOptions),
		rehypePlugins: getRehypePlugins(mdxOptions),
		recmaPlugins: mdxOptions.recmaPlugins,
		remarkRehypeOptions: mdxOptions.remarkRehype,
		jsxImportSource: 'astro',
		// Note: disable `.md` (and other alternative extensions for markdown files like `.markdown`) support
		format: 'mdx',
		mdExtensions: [],
		elementAttributeNameCase: 'html',
		SourceMapGenerator: extraOptions.sourcemap ? SourceMapGenerator : void 0,
	});
}
function getRemarkPlugins(mdxOptions) {
	let remarkPlugins = [];
	if (!isPerformanceBenchmark) {
		if (mdxOptions.gfm) {
			remarkPlugins.push(remarkGfm);
		}
		if (mdxOptions.smartypants !== false) {
			const smartypantsConfig =
				typeof mdxOptions.smartypants === 'object' ? mdxOptions.smartypants : {};
			remarkPlugins.push([remarkSmartypants, smartypantsConfig]);
		}
	}
	remarkPlugins.push(...mdxOptions.remarkPlugins, remarkCollectImages);
	return remarkPlugins;
}
function getRehypePlugins(mdxOptions) {
	let rehypePlugins = [
		// ensure `data.meta` is preserved in `properties.metastring` for rehype syntax highlighters
		rehypeMetaString,
		// rehypeRaw allows custom syntax highlighters to work without added config
		[rehypeRaw, { passThrough: nodeTypes }],
	];
	const syntaxHighlight = mdxOptions.syntaxHighlight;
	if (syntaxHighlight && !isPerformanceBenchmark) {
		const syntaxHighlightType =
			typeof syntaxHighlight === 'string' ? syntaxHighlight : syntaxHighlight?.type;
		const excludeLangs =
			typeof syntaxHighlight === 'object' ? syntaxHighlight?.excludeLangs : void 0;
		if (syntaxHighlightType === 'shiki') {
			rehypePlugins.push([rehypeShiki, mdxOptions.shikiConfig, excludeLangs]);
		} else if (syntaxHighlightType === 'prism') {
			rehypePlugins.push([rehypePrism, excludeLangs]);
		}
	}
	rehypePlugins.push(...mdxOptions.rehypePlugins, rehypeImageToComponent);
	if (!isPerformanceBenchmark) {
		rehypePlugins.push([rehypeHeadingIds], rehypeInjectHeadingsExport);
	}
	rehypePlugins.push(
		// Render info from `vfile.data.astro.frontmatter` as JS
		rehypeApplyFrontmatterExport,
		// Analyze MDX nodes and attach to `vfile.data.__astroMetadata`
		rehypeAnalyzeAstroMetadata,
	);
	if (mdxOptions.optimize) {
		const options = mdxOptions.optimize === true ? void 0 : mdxOptions.optimize;
		rehypePlugins.push([rehypeOptimizeStatic, options]);
	}
	return rehypePlugins;
}
export { createMdxProcessor };
