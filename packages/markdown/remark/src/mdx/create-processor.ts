import type {
	AstroMarkdownOptions,
	MdxRenderer,
	MdxRendererOptions,
	RemarkRehype,
	ShikiConfig,
	Smartypants,
	SyntaxHighlightConfig,
	SyntaxHighlightConfigType,
} from '@astrojs/internal-helpers/markdown';
import { createProcessor, nodeTypes } from '@mdx-js/mdx';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { SourceMapGenerator } from 'source-map';
import type { PluggableList } from 'unified';
import { VFile } from 'vfile';
import { rehypeHeadingIds } from '../rehype-collect-headings.js';
import { rehypePrism } from '../rehype-prism.js';
import { rehypeShiki } from '../rehype-shiki.js';
import { remarkCollectImages } from '../remark-collect-images.js';
import type { UnifiedResolvedOptions } from '../processor.js';
import { getAstroMetadata, rehypeAnalyzeAstroMetadata } from './rehype-analyze-astro-metadata.js';
import { rehypeApplyFrontmatterExport } from './rehype-apply-frontmatter-export.js';
import { rehypeInjectHeadingsExport } from './rehype-inject-headings-export.js';
import { rehypeImageToComponent } from './rehype-images-to-component.js';
import rehypeMetaString from './rehype-meta-string.js';
import { type OptimizeOptions, rehypeOptimizeStatic } from './rehype-optimize-static.js';
import { filterStringPlugins } from './utils.js';

// Skip nonessential plugins during performance benchmark runs
const isPerformanceBenchmark = Boolean(process.env.ASTRO_PERFORMANCE_BENCHMARK);

/** Fully-resolved inputs the unified MDX pipeline needs to build its processor. */
interface UnifiedMdxOptions {
	syntaxHighlight: SyntaxHighlightConfig | SyntaxHighlightConfigType | false | undefined;
	shikiConfig: ShikiConfig;
	gfm: boolean;
	smartypants: boolean | Smartypants;
	remarkPlugins: PluggableList;
	rehypePlugins: PluggableList;
	remarkRehype: RemarkRehype;
	recmaPlugins: PluggableList;
	optimize: boolean | OptimizeOptions;
}

interface MdxProcessorExtraOptions {
	sourcemap: boolean;
}

/**
 * Build the `MdxRenderer` for the `unified` processor. Called via
 * `unified().createMdxRenderer` — `options` are the processor's own remark/rehype
 * plugins, `shared` the cross-cutting markdown options, `mdx` the MDX-only inputs.
 */
export function createUnifiedMdxProcessor(
	shared: AstroMarkdownOptions,
	mdx: MdxRendererOptions,
	options: UnifiedResolvedOptions,
): MdxRenderer {
	const mdxOptions: UnifiedMdxOptions = {
		syntaxHighlight: shared.syntaxHighlight,
		shikiConfig: shared.shikiConfig ?? {},
		// `shared.gfm`/`smartypants` already encode the resolved precedence
		// (`mdx({...})` > `unified({...})` > deprecated `markdown.*`), applied by `@astrojs/mdx`.
		gfm: shared.gfm ?? true,
		smartypants: shared.smartypants ?? true,
		remarkPlugins: filterStringPlugins(options.remarkPlugins),
		rehypePlugins: filterStringPlugins(options.rehypePlugins),
		remarkRehype: options.remarkRehype,
		recmaPlugins: options.recmaPlugins,
		optimize: mdx.optimize,
	};

	const processor = createMdxProcessor(mdxOptions, { sourcemap: mdx.sourcemap ?? false });

	return {
		async process(content, filePath, frontmatter) {
			const vfile = new VFile({
				value: content,
				path: filePath,
				data: {
					astro: { frontmatter },
					applyFrontmatterExport: { srcDir: mdx.srcDir },
				},
			});
			const compiled = await processor.process(vfile);
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

export function createMdxProcessor(
	mdxOptions: UnifiedMdxOptions,
	extraOptions: MdxProcessorExtraOptions,
) {
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
		SourceMapGenerator: extraOptions.sourcemap ? SourceMapGenerator : undefined,
	});
}

function getRemarkPlugins(mdxOptions: UnifiedMdxOptions): PluggableList {
	let remarkPlugins: PluggableList = [];

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

function getRehypePlugins(mdxOptions: UnifiedMdxOptions): PluggableList {
	let rehypePlugins: PluggableList = [
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
			typeof syntaxHighlight === 'object' ? syntaxHighlight?.excludeLangs : undefined;
		// Apply syntax highlighters after user plugins to match `markdown/remark` behavior
		if (syntaxHighlightType === 'shiki') {
			rehypePlugins.push([rehypeShiki, mdxOptions.shikiConfig, excludeLangs]);
		} else if (syntaxHighlightType === 'prism') {
			rehypePlugins.push([rehypePrism, excludeLangs]);
		}
	}

	rehypePlugins.push(...mdxOptions.rehypePlugins, rehypeImageToComponent);

	if (!isPerformanceBenchmark) {
		// getHeadings() is guaranteed by TS, so this must be included.
		// We run `rehypeHeadingIds` _last_ to respect any custom IDs set by user plugins.
		rehypePlugins.push([rehypeHeadingIds], rehypeInjectHeadingsExport);
	}

	rehypePlugins.push(
		// Render info from `vfile.data.astro.frontmatter` as JS
		rehypeApplyFrontmatterExport,
		// Analyze MDX nodes and attach to `vfile.data.__astroMetadata`
		rehypeAnalyzeAstroMetadata,
	);

	if (mdxOptions.optimize) {
		// Convert user `optimize` option to compatible `rehypeOptimizeStatic` option
		const options = mdxOptions.optimize === true ? undefined : mdxOptions.optimize;
		rehypePlugins.push([rehypeOptimizeStatic, options]);
	}

	return rehypePlugins;
}
