import { pathToFileURL } from 'node:url';
import { isFrontmatterValid } from '@astrojs/internal-helpers/frontmatter';
import type { MarkdownHeading } from '@astrojs/internal-helpers/markdown';
import type { SatteriAstroData, SatteriResolvedOptions } from '@astrojs/markdown-satteri';
import {
	satteriCollectImagesPlugin,
	satteriCreateHighlightFn,
	satteriHeadingIdsPlugin,
	satteriHighlightPlugin,
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

	function initHighlighter() {
		initPromise = satteriCreateHighlightFn(mdxOptions.syntaxHighlight, mdxOptions.shikiConfig).then(
			(fn) => {
				highlightFn = fn;
			},
		);
	}

	return {
		async process(
			content: string,
			filePath: string,
			frontmatter: Record<string, any>,
		): Promise<CompileMdxResult> {
			if (!highlightFn && !initPromise) {
				initHighlighter();
			}
			if (initPromise) await initPromise;

			const astroData: SatteriAstroData = {
				frontmatter,
				headings: [],
				localImagePaths: new Set(),
				remoteImagePaths: new Set(),
			};

			const collectImages = satteriCollectImagesPlugin();
			const headingIds = satteriHeadingIdsPlugin();
			const astroMeta = createAstroMetadataPlugin(filePath);
			const imageImportInfo: ImageImportInfo = {
				importedImages: new Map(),
				hasImages: false,
			};
			const imageToComponent = createImageToComponentPlugin(imageImportInfo);

			const syntaxHighlight = mdxOptions.syntaxHighlight;
			const excludeLangs =
				typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

			// Collect last so image-URL rewrites by user plugins are captured.
			const allMdastPlugins: MdastPluginDefinition[] = [
				...satteriOptions.mdastPlugins,
				collectImages,
			];

			const hastPlugins: HastPluginDefinition[] = [];
			if (highlightFn) {
				// `mdx: true` wraps the highlighted HTML in a JSX `<Fragment set:html>` node
				// rather than a raw HTML node, since the Sätteri pipeline is compiling to JSX.
				hastPlugins.push(satteriHighlightPlugin(highlightFn, excludeLangs, { mdx: true }));
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
					// `mdxOptions.gfm`/`smartypants` are always boolean-shaped; skip the override when
					// satteri's feature is an object so granular config isn't clobbered.
					...(typeof satteriOptions.features.gfm === 'object'
						? {}
						: { gfm: mdxOptions.gfm !== false }),
					...(typeof satteriOptions.features.smartPunctuation === 'object'
						? {}
						: { smartPunctuation: mdxOptions.smartypants !== false }),
				},
				fileURL: pathToFileURL(filePath),
				jsxImportSource: 'astro',
				data: { astro: astroData },
			});
			let compiled = mdxResult.code;

			// Read the returned bag, not the seeded reference, so a plugin that replaces it is honored.
			const astro = mdxResult.data.astro;
			const headings = astro?.headings ?? [];
			const astroMetadata = mdxResult.data.__astroMetadata ?? createDefaultAstroMetadata();

			// Plugins may have mutated frontmatter; emit the final value.
			const resolvedFrontmatter = astro?.frontmatter;
			if (!resolvedFrontmatter || !isFrontmatterValid(resolvedFrontmatter)) {
				throw new Error(
					'[MDX] A Sätteri plugin attempted to inject invalid frontmatter. Ensure `ctx.data.astro.frontmatter` is a valid object that is not `null` or `undefined`.',
				);
			}

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

			compiled += `\nexport const frontmatter = ${JSON.stringify(resolvedFrontmatter)};`;
			compiled += `\nexport function getHeadings() { return ${JSON.stringify(headings)}; }`;

			if (resolvedFrontmatter.layout) {
				compiled = compiled.replace(/^function MDXContent\(/m, 'function __OriginalMDXContent__(');
				compiled += `
import { jsx as __astro_layout_jsx__ } from 'astro/jsx-runtime';
import __astro_layout_component__ from ${JSON.stringify(resolvedFrontmatter.layout)};
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
