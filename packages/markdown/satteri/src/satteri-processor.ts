import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import {
	defaultExcludeLanguages,
	markdownConfigDefaults,
	syntaxHighlightDefaults,
} from '@astrojs/internal-helpers/markdown';
import Slugger from 'github-slugger';
import type { Features, HastNode, HastPluginDefinition, MdastPluginDefinition } from 'satteri';
import { createShikiHighlighter } from '@astrojs/internal-helpers/shiki';
import type {
	AstroMarkdownOptions,
	MarkdownHeading,
	MarkdownRenderer,
} from '@astrojs/internal-helpers/markdown';

type HighlightFn = (code: string, lang: string, meta?: string) => Promise<string>;

declare module 'satteri' {
	interface DataMap {
		astro: SatteriAstroData;
	}
}

export interface SatteriAstroData {
	frontmatter: Record<string, any>;
	headings: MarkdownHeading[];
	localImagePaths: Set<string>;
	remoteImagePaths: Set<string>;
}

let satteri: typeof import('satteri') | undefined;

// Loaded lazily so the Sätteri Rust/WASM binary isn't pulled in unless the
// Sätteri processor actually runs.
async function loadSatteri(): Promise<typeof import('satteri')> {
	satteri ??= await import('satteri');
	return satteri;
}

export function createCollectImagesPlugin(
	image: AstroMarkdownOptions['image'] = {},
): MdastPluginDefinition {
	const domains = image?.domains ?? [];
	const remotePatterns = image?.remotePatterns ?? [];
	return {
		name: 'collect-images',
		image(node, ctx) {
			const url = node.url ? decodeURI(node.url) : undefined;
			if (!url) return;

			const astro = ctx.data.astro;
			if (URL.canParse(url)) {
				if (isRemoteAllowed(url, { domains, remotePatterns })) {
					astro?.remoteImagePaths.add(url);
				}
			} else if (!url.startsWith('/')) {
				astro?.localImagePaths.add(url);
			}
		},
	};
}

function resolveFrontmatterExpression(
	expr: string,
	frontmatter: Record<string, any>,
): string | undefined {
	if (!expr.startsWith('frontmatter.') && !expr.startsWith('frontmatter[')) return undefined;

	const pathStr = expr.slice('frontmatter'.length);
	const parts: string[] = [];
	const pathRegex = /\.(\w+)|\[(\d+)\]|\["([^"]+)"\]|\['([^']+)'\]/g;
	let match;
	while ((match = pathRegex.exec(pathStr)) !== null) {
		parts.push(match[1] ?? match[2] ?? match[3] ?? match[4]);
	}

	if (parts.length === 0) return undefined;

	let value: any = frontmatter;
	for (const key of parts) {
		if (value == null || typeof value !== 'object') return undefined;
		value = value[key];
	}

	return typeof value === 'string' ? value : undefined;
}

export function collectHastText(
	node: HastNode,
	frontmatter: Record<string, any> | undefined,
): string {
	let text = '';
	if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
		if (node.value != null && frontmatter) {
			const resolved = resolveFrontmatterExpression(node.value.trim(), frontmatter);
			text += resolved ?? node.value;
		}
	} else if ('value' in node && node.value != null) {
		text += node.value;
	}
	if ('children' in node && node.children) {
		for (const child of node.children) {
			text += collectHastText(child as HastNode, frontmatter);
		}
	}
	return text;
}

export function makeFragmentNode(html: string): HastNode {
	return {
		type: 'mdxJsxFlowElement',
		name: 'Fragment',
		attributes: [{ type: 'mdxJsxAttribute', name: 'set:html', value: html }],
		children: [],
	} as unknown as HastNode;
}

export function createHeadingIdsPlugin(): HastPluginDefinition {
	const slugger = new Slugger();
	// Collect headings in a separate array so we can make this idempotent
	const headings: MarkdownHeading[] = [];
	return {
		name: 'heading-ids',
		element: {
			filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			visit(node, ctx) {
				const astro = ctx.data.astro;
				const rawText = ctx.textContent(node);
				const text = rawText.includes('frontmatter')
					? collectHastText(node, astro?.frontmatter ?? {})
					: rawText;
				const existingId = node.properties?.id;
				const slug = typeof existingId === 'string' ? existingId : slugger.slug(text);
				const depth = Number.parseInt(node.tagName[1], 10);
				headings.push({ depth, slug, text });
				if (astro) astro.headings = headings;
				if (typeof existingId !== 'string') {
					ctx.setProperty(node, 'id', slug);
				}
			},
		},
	};
}

function makeRawNode(html: string): HastNode {
	return { type: 'raw', value: html } as unknown as HastNode;
}

const HAST_PRESERVED_PROPERTIES = new Set(['className', 'htmlFor']);

/** Tags <img> with `__ASTRO_IMAGE_` for astro's vite-plugin-markdown to replace with the processed image's attributes. */
export function createImageMarkerPlugin(): HastPluginDefinition {
	const indexBySrc = new Map<string, number>();
	return {
		name: 'image-marker',
		element: {
			filter: ['img'],
			visit(node, ctx) {
				const props = (node.properties ?? {}) as Record<string, unknown>;
				const rawSrc = typeof props.src === 'string' ? props.src : undefined;
				if (!rawSrc) return;
				const src = decodeURI(rawSrc);

				const astro = ctx.data.astro;
				const isLocal = astro?.localImagePaths.has(src) ?? false;
				const isRemote = !isLocal && (astro?.remoteImagePaths.has(src) ?? false);
				if (!isLocal && !isRemote) return;

				const { src: _src, ...rest } = props;
				const index = indexBySrc.get(rawSrc) ?? 0;
				indexBySrc.set(rawSrc, index + 1);

				const imageProperties: Record<string, unknown> = { ...rest, src, index };
				if (isRemote && !('width' in props) && !('height' in props)) {
					imageProperties.inferSize = true;
				}

				ctx.setProperty(node, '__ASTRO_IMAGE_', JSON.stringify(imageProperties));
				for (const key of Object.keys(rest)) {
					if (!HAST_PRESERVED_PROPERTIES.has(key)) {
						ctx.setProperty(node, key, null);
					}
				}
				ctx.setProperty(node, 'src', null);
			},
		},
	};
}

export function createHighlightPlugin(
	highlight: HighlightFn,
	excludeLangs: string[] | undefined,
	options?: { mdx?: boolean },
): HastPluginDefinition {
	const wrapResult = options?.mdx ? makeFragmentNode : makeRawNode;
	return {
		name: 'highlight',
		element: {
			filter: ['pre'],
			async visit(node, ctx) {
				const codeChild = node.children?.find(
					(c: HastNode) => c.type === 'element' && c.tagName === 'code',
				) as HastNode | undefined;
				if (!codeChild || codeChild.type !== 'element') return;

				const lang = (codeChild.data as any)?.lang ?? 'plaintext';
				const meta = (codeChild.data as any)?.meta ?? undefined;

				if (
					(excludeLangs && excludeLangs.includes(lang)) ||
					defaultExcludeLanguages.includes(lang)
				) {
					return;
				}

				const code = ctx.textContent(codeChild).replace(/\n$/, '');
				const html = await highlight(code, lang, meta);
				return wrapResult(html);
			},
		},
	};
}

export interface SatteriMarkdownProcessorOptions extends AstroMarkdownOptions {
	mdastPlugins?: MdastPluginDefinition[];
	hastPlugins?: HastPluginDefinition[];
	features?: Features;
}

/**
 * Build the highlighter for the Sätteri pipeline, or `undefined` when syntax
 * highlighting is disabled. Shiki and Prism both resolve to a `HighlightFn`
 * that turns a code block into a complete `<pre>` HTML string.
 */
export async function createHighlightFn(
	syntaxHighlight: AstroMarkdownOptions['syntaxHighlight'],
	shikiConfig: AstroMarkdownOptions['shikiConfig'] | undefined,
): Promise<HighlightFn | undefined> {
	const syntaxHighlightType =
		typeof syntaxHighlight === 'string'
			? syntaxHighlight
			: syntaxHighlight
				? syntaxHighlight.type
				: undefined;

	if (syntaxHighlightType === 'shiki') {
		const hl = await createShikiHighlighter({
			langs: shikiConfig?.langs,
			theme: shikiConfig?.theme,
			themes: shikiConfig?.themes,
			langAlias: shikiConfig?.langAlias,
		});
		return (code, lang, meta) =>
			hl.codeToHtml(code, lang, {
				meta,
				wrap: shikiConfig?.wrap,
				defaultColor: shikiConfig?.defaultColor,
				transformers: shikiConfig?.transformers,
			});
	}

	if (syntaxHighlightType === 'prism') {
		const { runHighlighterWithAstro } = await import('@astrojs/prism/dist/highlighter');
		return async (code, lang) => {
			const { html, classLanguage } = await runHighlighterWithAstro(lang, code);
			return `<pre class="${classLanguage}" data-language="${lang}"><code class="${classLanguage}">${html}</code></pre>`;
		};
	}

	return undefined;
}

export async function createSatteriMarkdownProcessor(
	opts?: SatteriMarkdownProcessorOptions,
): Promise<MarkdownRenderer> {
	const s = await loadSatteri();

	const {
		syntaxHighlight = syntaxHighlightDefaults,
		shikiConfig = markdownConfigDefaults.shikiConfig,
		gfm = markdownConfigDefaults.gfm,
		smartypants = markdownConfigDefaults.smartypants,
		mdastPlugins: userMdastPlugins = [],
		hastPlugins: userHastPlugins = [],
		features: userFeatures,
	} = opts ?? {};

	const highlightFn = await createHighlightFn(syntaxHighlight, shikiConfig);

	const syntaxHighlightExcludeLangs =
		typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

	return {
		async render(content, renderOpts) {
			const astro: SatteriAstroData = {
				frontmatter: renderOpts?.frontmatter ?? {},
				headings: [],
				localImagePaths: new Set(),
				remoteImagePaths: new Set(),
			};

			// Collect last so image-URL rewrites by user plugins are captured.
			const allMdastPlugins: MdastPluginDefinition[] = [
				...userMdastPlugins,
				createCollectImagesPlugin(opts?.image),
			];

			const hastPlugins: HastPluginDefinition[] = [];
			if (highlightFn) {
				hastPlugins.push(createHighlightPlugin(highlightFn, syntaxHighlightExcludeLangs));
			}
			hastPlugins.push(...userHastPlugins);
			hastPlugins.push(createImageMarkerPlugin());
			hastPlugins.push(createHeadingIdsPlugin());

			const { html, data } = await s.markdownToHtml(content, {
				mdastPlugins: allMdastPlugins,
				hastPlugins,
				features: {
					gfm: gfm !== false,
					smartPunctuation: smartypants !== false,
					...userFeatures,
				},
				fileURL: renderOpts?.fileURL,
				data: { astro },
			});

			// Read the returned bag, not the seeded reference, so a plugin that replaces
			// `ctx.data.astro` wholesale is honored.
			const result = data.astro;
			return {
				code: html,
				metadata: {
					headings: result?.headings ?? [],
					localImagePaths: result ? Array.from(result.localImagePaths) : [],
					remoteImagePaths: result ? Array.from(result.remoteImagePaths) : [],
					frontmatter: result?.frontmatter ?? {},
				},
			};
		},
	};
}
