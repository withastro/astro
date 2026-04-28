import Slugger from 'github-slugger';
import { createShikiHighlighter } from './shiki.js';
import { defaultExcludeLanguages } from './highlight.js';
import type {
	AstroMarkdownProcessorOptions,
	MarkdownHeading,
	MarkdownProcessor,
} from './types.js';
import { markdownConfigDefaults, syntaxHighlightDefaults } from './index.js';

type HighlightFn = (code: string, lang: string, meta?: string) => Promise<string>;

// Lazily loaded satteri module
let satteri: typeof import('satteri') | undefined;

async function loadSatteri(): Promise<typeof import('satteri')> {
	if (satteri) return satteri;
	try {
		satteri = await import('satteri');
		return satteri;
	} catch {
		throw new Error(
			'`experimental.nativeMarkdown` requires the `satteri` package. Install it with:\n  npm install satteri',
		);
	}
}

// ── Shared satteri plugin factories ──
// Used by both the markdown processor here and the MDX satteri processor
// in @astrojs/mdx. All require loadSatteri() to have been called first.

export function createCollectImagesPlugin(
	localImagePaths: Set<string>,
	remoteImagePaths: Set<string>,
): import('satteri').MdastPluginDefinition {
	return satteri!.defineMdastPlugin({
		name: 'collect-images',
		image(node) {
			const url = node.url ? decodeURI(node.url) : undefined;
			if (!url) return;

			if (URL.canParse(url)) {
				remoteImagePaths.add(url);
			} else if (!url.startsWith('/')) {
				localImagePaths.add(url);
			}
		},
	});
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
	node: import('satteri').HastNode,
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
			text += collectHastText(child as import('satteri').HastNode, frontmatter);
		}
	}
	return text;
}

export function makeFragmentNode(html: string): import('satteri').HastNode {
	return {
		type: 'mdxJsxFlowElement',
		name: 'Fragment',
		attributes: [{ type: 'mdxJsxAttribute', name: 'set:html', value: html }],
		children: [],
	} as unknown as import('satteri').HastNode;
}

export function createHeadingIdsPlugin(
	headings: MarkdownHeading[],
	frontmatter: Record<string, any> | undefined,
): import('satteri').HastPluginDefinition {
	const slugger = new Slugger();
	return satteri!.defineHastPlugin({
		name: 'heading-ids',
		element: {
			filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			visit(node, ctx) {
				const rawText = ctx.textContent(node);
				const text =
					frontmatter && rawText.includes('frontmatter')
						? collectHastText(node, frontmatter)
						: rawText;
				const slug = slugger.slug(text);
				const depth = Number.parseInt(node.tagName[1], 10);
				headings.push({ depth, slug, text });
				ctx.setProperty(node, 'id', slug);
			},
		},
	});
}

function makeRawNode(html: string): import('satteri').HastNode {
	return { type: 'raw', value: html } as unknown as import('satteri').HastNode;
}

export function createShikiPlugin(
	highlight: HighlightFn,
	excludeLangs: string[] | undefined,
	options?: { mdx?: boolean },
): import('satteri').HastPluginDefinition {
	const wrapResult = options?.mdx ? makeFragmentNode : makeRawNode;
	return satteri!.defineHastPlugin({
		name: 'shiki-highlight',
		element: {
			filter: ['pre'],
			async visit(node, ctx) {
				const codeChild = node.children?.find(
					(c: import('satteri').HastNode) => c.type === 'element' && c.tagName === 'code',
				) as import('satteri').HastNode | undefined;
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
	});
}

// ── Satteri Markdown Processor ��─

export interface SatteriMarkdownProcessorOptions extends AstroMarkdownProcessorOptions {
	mdastPlugins?: import('satteri').MdastPluginDefinition[];
	hastPlugins?: import('satteri').HastPluginDefinition[];
	features?: import('satteri').Features;
}

export async function createSatteriMarkdownProcessor(
	opts?: SatteriMarkdownProcessorOptions,
): Promise<MarkdownProcessor> {
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

	const syntaxHighlightType =
		typeof syntaxHighlight === 'string'
			? syntaxHighlight
			: syntaxHighlight
				? syntaxHighlight.type
				: undefined;

	if (syntaxHighlightType === 'prism') {
		throw new Error(
			'Prism syntax highlighting is not supported with `experimental.nativeMarkdown`. Use shiki instead.',
		);
	}

	let highlightFn: HighlightFn | undefined;
	if (syntaxHighlightType === 'shiki') {
		const hl = await createShikiHighlighter({
			langs: shikiConfig.langs,
			theme: shikiConfig.theme,
			themes: shikiConfig.themes,
			langAlias: shikiConfig.langAlias,
		});
		highlightFn = (code, lang, meta) =>
			hl.codeToHtml(code, lang, {
				meta,
				wrap: shikiConfig.wrap,
				defaultColor: shikiConfig.defaultColor,
				transformers: shikiConfig.transformers,
			});
	}

	const syntaxHighlightExcludeLangs =
		typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

	return {
		async render(content, renderOpts) {
			const headings: MarkdownHeading[] = [];
			const localImagePaths = new Set<string>();
			const remoteImagePaths = new Set<string>();
			const frontmatter = renderOpts?.frontmatter ?? {};

			const allMdastPlugins: import('satteri').MdastPluginDefinition[] = [
				createCollectImagesPlugin(localImagePaths, remoteImagePaths),
				...userMdastPlugins,
			];

			const hastPlugins: import('satteri').HastPluginDefinition[] = [];
			if (highlightFn) {
				hastPlugins.push(createShikiPlugin(highlightFn, syntaxHighlightExcludeLangs));
			}
			hastPlugins.push(createHeadingIdsPlugin(headings, frontmatter));
			hastPlugins.push(...userHastPlugins);

			const html = await s.markdownToHtml(content, {
				mdastPlugins: allMdastPlugins,
				hastPlugins,
				features: {
					gfm: gfm !== false,
					smartPunctuation: smartypants !== false,
					...userFeatures,
				},
				filename: renderOpts?.fileURL?.pathname,
			});

			return {
				code: html,
				metadata: {
					headings,
					localImagePaths: Array.from(localImagePaths),
					remoteImagePaths: Array.from(remoteImagePaths),
					frontmatter,
				},
			};
		},
	};
}
