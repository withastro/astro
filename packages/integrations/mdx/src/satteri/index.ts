import type { MarkdownHeading } from '@astrojs/internal-helpers/markdown';
import { createShikiHighlighter } from '@astrojs/internal-helpers/shiki';
import type { SatteriResolvedOptions } from '@astrojs/markdown-satteri';
import {
	satteriCollectImagesPlugin,
	satteriHeadingIdsPlugin,
	satteriShikiPlugin,
} from '@astrojs/markdown-satteri';
import { createDefaultAstroMetadata } from 'astro/markdown';
import {
	mdxToJs,
	type HastPluginDefinition,
	type MdastPluginDefinition,
	type MdxCompileOptions,
} from 'satteri';
import { ASTRO_IMAGE_IMPORT, USES_ASTRO_IMAGE_FLAG } from '../image-constants.js';
import type { ResolvedMdxOptions } from '../index.js';
import { shouldAddCharset } from './charset.js';
import { type AstroMetadata, createAstroMetadataPlugin } from './hast-astro-metadata.js';
import { createImageToComponentPlugin, type ImageImportInfo } from './hast-images-to-component.js';

type HighlightFn = (code: string, lang: string, meta?: string) => Promise<string>;

export type { MdastPluginDefinition, HastPluginDefinition, MarkdownHeading };
export type { AstroMetadata } from './hast-astro-metadata.js';

declare module 'hast' {
	interface ElementData {
		lang?: string | null;
	}
}

export interface CompileMdxResult {
	code: string;
	astroMetadata: AstroMetadata;
}

interface CreateMdxProcessorContext {
	srcDir: URL;
}

export function createMdxProcessor(
	mdxOptions: ResolvedMdxOptions,
	satteriOptions: SatteriResolvedOptions,
	ctx: CreateMdxProcessorContext,
) {
	let highlightFn: HighlightFn | undefined;
	let initPromise: Promise<void> | undefined;

	function initShiki() {
		const syntaxHighlight = mdxOptions.syntaxHighlight;
		const syntaxHighlightType =
			typeof syntaxHighlight === 'string'
				? syntaxHighlight
				: syntaxHighlight
					? syntaxHighlight.type
					: undefined;

		if (syntaxHighlightType === 'prism') {
			throw new Error(
				'Prism syntax highlighting is not supported by the `satteri()` markdown processor. Use shiki instead, or switch to `markdown.processor: unified({...})`.',
			);
		}

		if (syntaxHighlightType === 'shiki') {
			const shikiConfig = mdxOptions.shikiConfig ?? {};
			initPromise = createShikiHighlighter({
				langs: shikiConfig.langs,
				theme: shikiConfig.theme,
				themes: shikiConfig.themes,
				langAlias: shikiConfig.langAlias,
			}).then((hl) => {
				highlightFn = (code, lang, meta) =>
					hl.codeToHtml(code, lang, {
						meta,
						wrap: shikiConfig.wrap,
						defaultColor: shikiConfig.defaultColor,
						transformers: shikiConfig.transformers,
					});
			});
		}
	}

	return {
		async process(
			content: string,
			filePath: string,
			frontmatter: Record<string, any>,
		): Promise<CompileMdxResult> {
			if (!highlightFn && !initPromise) {
				initShiki();
			}
			if (initPromise) await initPromise;

			const headings: MarkdownHeading[] = [];
			const localImagePaths = new Set<string>();
			const remoteImagePaths = new Set<string>();

			const astroMetadata = createDefaultAstroMetadata();

			const collectImages = satteriCollectImagesPlugin(localImagePaths, remoteImagePaths);
			const headingIds = satteriHeadingIdsPlugin(headings, frontmatter);
			const astroMeta = createAstroMetadataPlugin(astroMetadata, filePath);
			const imageImportInfo: ImageImportInfo = {
				importedImages: new Map(),
				hasImages: false,
			};
			const imageToComponent = createImageToComponentPlugin(
				localImagePaths,
				remoteImagePaths,
				imageImportInfo,
			);

			const syntaxHighlight = mdxOptions.syntaxHighlight;
			const excludeLangs =
				typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

			const allMdastPlugins: MdastPluginDefinition[] = satteriOptions.mdastPlugins.length
				? [collectImages, ...satteriOptions.mdastPlugins]
				: [collectImages];

			const hastPlugins: HastPluginDefinition[] = [];
			if (highlightFn) {
				// `mdx: true` wraps the highlighted HTML in a JSX `<Fragment set:html>` node
				// rather than a raw HTML node, since the Sätteri pipeline is compiling to JSX.
				hastPlugins.push(satteriShikiPlugin(highlightFn, excludeLangs, { mdx: true }));
			}
			if (satteriOptions.hastPlugins.length) {
				hastPlugins.push(...satteriOptions.hastPlugins);
			}
			hastPlugins.push(imageToComponent, headingIds, astroMeta);

			let optimizeStatic: MdxCompileOptions['optimizeStatic'];
			if (mdxOptions.optimize) {
				const ignoreElements =
					typeof mdxOptions.optimize === 'object'
						? mdxOptions.optimize.ignoreElementNames
						: undefined;

				optimizeStatic = {
					component: 'Fragment',
					prop: 'set:html',
					...(ignoreElements && { ignoreElements }),
				};
			}

			const mdxResult = await mdxToJs(content, {
				mdastPlugins: allMdastPlugins,
				hastPlugins,
				optimizeStatic,
				features: {
					...satteriOptions.features,
					gfm: mdxOptions.gfm !== false,
					// `mdxOptions.smartypants` is always boolean-shaped; skip the override when
					// satteri's `smartPunctuation` is an object so granular config isn't clobbered.
					...(typeof satteriOptions.features.smartPunctuation === 'object'
						? {}
						: { smartPunctuation: mdxOptions.smartypants !== false }),
				},
				filename: filePath,
				jsxImportSource: 'astro',
			});
			let compiled = mdxResult.code;

			compiled = compiled.replace(/^export default MDXContent;\s*$/m, '');

			if (imageImportInfo.hasImages) {
				// `vite-plugin-mdx-postprocess` wraps Content to map
				// `astro-image` → `components.img ?? __AstroImage__`, so a user's
				// `export const components = { img: ... }` override is honored.
				compiled += `\nimport { Image as ${ASTRO_IMAGE_IMPORT} } from "astro:assets";`;
				for (const [src, importName] of imageImportInfo.importedImages) {
					compiled += `\nimport ${importName} from ${JSON.stringify(src)};`;
				}
				compiled += `\nexport const ${USES_ASTRO_IMAGE_FLAG} = true;`;
			}

			compiled += `\nexport const frontmatter = ${JSON.stringify(frontmatter)};`;
			compiled += `\nexport function getHeadings() { return ${JSON.stringify(headings)}; }`;

			if (frontmatter.layout) {
				compiled = compiled.replace(/^function MDXContent\(/m, 'function __OriginalMDXContent__(');
				compiled += `
import { jsx as __astro_layout_jsx__ } from 'astro/jsx-runtime';
import __astro_layout_component__ from ${JSON.stringify(frontmatter.layout)};
export default function MDXContent(props) {
	const content = __OriginalMDXContent__(props);
	const { layout, ...frontmatterContent } = frontmatter;
	frontmatterContent.file = file;
	frontmatterContent.url = url;
	return __astro_layout_jsx__(__astro_layout_component__, {
		file,
		url,
		content: frontmatterContent,
		frontmatter: frontmatterContent,
		headings: getHeadings(),
		'server:root': true,
		children: content,
	});
}`;
			} else if (shouldAddCharset(content, filePath, ctx.srcDir)) {
				// Default MDX pages without a layout to UTF-8 so users don't have to think about it.
				compiled = compiled.replace(/^function MDXContent\(/m, 'function __OriginalMDXContent__(');
				compiled += `
import { jsx as __astro_charset_jsx__, jsxs as __astro_charset_jsxs__, Fragment as __astro_charset_Fragment__ } from 'astro/jsx-runtime';
export default function MDXContent(props) {
	return __astro_charset_jsxs__(__astro_charset_Fragment__, {
		children: [
			__astro_charset_jsx__('meta', { charset: 'utf-8' }),
			__OriginalMDXContent__(props),
		],
	});
}`;
			}

			return {
				code: compiled,
				astroMetadata,
			};
		},
	};
}
