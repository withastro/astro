import * as path from 'node:path';
import { createShikiHighlighter } from '@astrojs/markdown-remark';
import {
	defineMdastPlugin,
	defineHastPlugin,
	mdxToJs,
	type HastNode,
	type HastVisitorContext,
	type MdastPluginDefinition,
	type HastPluginDefinition,
} from 'satteri';
import Slugger from 'github-slugger';
import type { MdxOptions } from './index.js';

export type { MdastPluginDefinition, HastPluginDefinition };

declare module 'hast' {
	interface ElementData {
		lang?: string | null;
	}
}

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

type HighlightFn = (code: string, lang: string, meta?: string) => Promise<string>;

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

function collectHastText(node: HastNode, frontmatter: Record<string, any> | undefined): string {
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

const defaultExcludeLanguages = ['math'];

function makeFragmentNode(html: string): HastNode {
	return {
		type: 'mdxJsxFlowElement',
		name: 'Fragment',
		attributes: [{ type: 'mdxJsxAttribute', name: 'set:html', value: html }],
		children: [],
	};
}

interface AstroComponentMetadata {
	exportName: string;
	localName: string;
	specifier: string;
	resolvedPath: string;
}

export interface AstroMetadata {
	hydratedComponents: AstroComponentMetadata[];
	clientOnlyComponents: AstroComponentMetadata[];
	serverComponents: AstroComponentMetadata[];
	scripts: never[];
	propagation: 'none';
	containsHead: false;
	pageOptions: Record<string, never>;
}

type ImportSpecifier = { local: string; imported: string };
type MatchedImport = { name: string; path: string };

const nonAlphaRe = /[^a-zA-Z]/;

function isComponent(tagName: string): boolean {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		nonAlphaRe.test(tagName[0])
	);
}

// ESTree shapes we care about from the parseExpression() output on mdxjsEsm nodes.
interface EstreeIdentifier {
	type: 'Identifier';
	name: string;
}

interface EstreeStringLiteral {
	type: 'Literal';
	value: string;
}

type EstreeModuleExportName = EstreeIdentifier | EstreeStringLiteral;

interface EstreeImportDeclaration {
	type: 'ImportDeclaration';
	source: EstreeStringLiteral;
	specifiers: Array<
		EstreeImportSpecifier | EstreeImportDefaultSpecifier | EstreeImportNamespaceSpecifier
	>;
}

interface EstreeImportSpecifier {
	type: 'ImportSpecifier';
	local: EstreeIdentifier;
	imported: EstreeModuleExportName;
}

interface EstreeImportDefaultSpecifier {
	type: 'ImportDefaultSpecifier';
	local: EstreeIdentifier;
}

interface EstreeImportNamespaceSpecifier {
	type: 'ImportNamespaceSpecifier';
	local: EstreeIdentifier;
}

interface EstreeProgram {
	body: Array<{ type: string } & Record<string, any>>;
}

function exportNameToString(name: EstreeModuleExportName): string {
	return name.type === 'Identifier' ? name.name : name.value;
}

function collectImportsFromEsm(
	program: EstreeProgram,
	imports: Map<string, Set<ImportSpecifier>>,
): void {
	for (const stmt of program.body) {
		if (stmt.type !== 'ImportDeclaration') continue;
		const decl = stmt as EstreeImportDeclaration;
		const source = decl.source.value;

		let specSet = imports.get(source);
		if (!specSet) {
			specSet = new Set();
			imports.set(source, specSet);
		}

		for (const spec of decl.specifiers) {
			switch (spec.type) {
				case 'ImportDefaultSpecifier':
					specSet.add({ local: spec.local.name, imported: 'default' });
					break;
				case 'ImportNamespaceSpecifier':
					specSet.add({ local: spec.local.name, imported: '*' });
					break;
				case 'ImportSpecifier':
					specSet.add({
						local: spec.local.name,
						imported: exportNameToString(spec.imported),
					});
					break;
			}
		}
	}
}

function findMatchingImport(
	tagName: string,
	imports: Map<string, Set<ImportSpecifier>>,
): MatchedImport | undefined {
	const tagSpecifier = tagName.split('.')[0];
	for (const [source, specs] of imports) {
		for (const { imported, local } of specs) {
			if (local === tagSpecifier) {
				if (tagSpecifier !== tagName) {
					switch (imported) {
						case '*': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: accessPath, path: source };
						}
						case 'default': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: `default.${accessPath}`, path: source };
						}
						default: {
							return { name: tagName, path: source };
						}
					}
				}
				return { name: imported, path: source };
			}
		}
	}
}

function resolveImportPath(specifier: string, importer: string): string {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return absoluteSpecifier.split(path.sep).join('/');
	}
	return specifier;
}

type MdxJsxFlowElement = Extract<HastNode, { type: 'mdxJsxFlowElement' }>;
type MdxJsxTextElement = Extract<HastNode, { type: 'mdxJsxTextElement' }>;
type MdxJsxHastNode = MdxJsxFlowElement | MdxJsxTextElement;

function hasDirective(node: MdxJsxHastNode, prefix: string): boolean {
	for (const a of node.attributes) {
		if (a.type === 'mdxJsxAttribute' && a.name.startsWith(prefix)) return true;
	}
	return false;
}

function findAttrValue(node: MdxJsxHastNode, name: string): string | null {
	for (const a of node.attributes) {
		if (a.type === 'mdxJsxAttribute' && a.name === name) {
			return typeof a.value === 'string' ? a.value : null;
		}
	}
	return null;
}

function processJsxNode(
	node: MdxJsxHastNode,
	ctx: HastVisitorContext,
	metadata: AstroMetadata,
	imports: Map<string, Set<ImportSpecifier>>,
	filePath: string,
) {
	const tagName = node.name;
	if (!tagName || !isComponent(tagName)) return;

	const hasClient = hasDirective(node, 'client:');
	const hasServerDefer = !hasClient && hasDirective(node, 'server:defer');
	if (!hasClient && !hasServerDefer) return;

	const matchedImport = findMatchingImport(tagName, imports);
	if (!matchedImport) {
		throw new Error(
			`Expected a matching import for component \`${tagName}\`. Did you forget to import it?`,
		);
	}

	if (matchedImport.path.endsWith('.astro') && hasClient) {
		let clientAttr = 'client:*';
		for (const a of node.attributes) {
			if (a.type === 'mdxJsxAttribute' && a.name.startsWith('client:')) {
				clientAttr = a.name;
				break;
			}
		}
		console.warn(
			`You are attempting to render <${tagName} ${clientAttr} />, but ${tagName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
		);
	}

	const resolvedPath = resolveImportPath(matchedImport.path, filePath);
	const exportName =
		matchedImport.name === '*' ? tagName.split('.').slice(1).join('.') : matchedImport.name;

	if (hasClient && findAttrValue(node, 'client:only') !== null) {
		metadata.clientOnlyComponents.push({
			exportName: matchedImport.name,
			localName: '',
			specifier: tagName,
			resolvedPath,
		});
		ctx.setProperty(node, 'client:display-name', tagName);
		ctx.setProperty(node, 'client:component-path', resolvedPath);
		ctx.setProperty(node, 'client:component-export', exportName);
		ctx.setProperty(node, 'client:component-hydration', '');
	} else if (hasClient) {
		metadata.hydratedComponents.push({
			exportName: '*',
			localName: '',
			specifier: tagName,
			resolvedPath,
		});
		ctx.setProperty(node, 'client:component-path', resolvedPath);
		ctx.setProperty(node, 'client:component-export', exportName);
		ctx.setProperty(node, 'client:component-hydration', '');
	} else if (hasServerDefer) {
		metadata.serverComponents.push({
			exportName: matchedImport.name,
			localName: tagName,
			specifier: matchedImport.path,
			resolvedPath,
		});
		ctx.setProperty(node, 'server:component-directive', 'server:defer');
		ctx.setProperty(node, 'server:component-path', resolvedPath);
		ctx.setProperty(node, 'server:component-export', exportName);
	}
}

const exportConstComponentsRe = /export\s+const\s+components\s*=\s*\{([^}]*)\}/;

function extractComponentOverrides(content: string): string[] {
	const match = exportConstComponentsRe.exec(content);
	if (!match) return [];
	const body = match[1];
	const keys: string[] = [];
	for (const part of body.split(',')) {
		const keyMatch = /^(\w+)\s*:/.exec(part.trim());
		if (keyMatch) {
			keys.push(keyMatch[1]);
		}
	}
	return keys;
}

function createCollectImagesPlugin(
	localImagePaths: Set<string>,
	remoteImagePaths: Set<string>,
): MdastPluginDefinition {
	return defineMdastPlugin({
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

function createHeadingIdsPlugin(
	headings: MarkdownHeading[],
	frontmatter: Record<string, any> | undefined,
): HastPluginDefinition {
	const slugger = new Slugger();
	return defineHastPlugin({
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

function createShikiPlugin(
	highlight: HighlightFn,
	excludeLangs: string[] | undefined,
): HastPluginDefinition {
	return defineHastPlugin({
		name: 'shiki-highlight',
		element: {
			filter: ['pre'],
			async visit(node, ctx) {
				const codeChild = node.children?.find(
					(c: HastNode) => c.type === 'element' && c.tagName === 'code',
				) as HastNode | undefined;
				if (!codeChild || codeChild.type !== 'element') return;

				const lang = codeChild.data?.lang ?? 'plaintext';
				const meta = codeChild.data?.meta ?? undefined;

				if (
					(excludeLangs && excludeLangs.includes(lang)) ||
					defaultExcludeLanguages.includes(lang)
				) {
					return;
				}

				const code = ctx.textContent(codeChild).replace(/\n$/, '');
				const html = await highlight(code, lang, meta);
				return makeFragmentNode(html);
			},
		},
	});
}

function createAstroMetadataPlugin(
	metadata: AstroMetadata,
	filePath: string,
): HastPluginDefinition {
	const imports = new Map<string, Set<ImportSpecifier>>();
	return defineHastPlugin({
		name: 'astro-metadata',
		mdxjsEsm(node) {
			const program = node.parseExpression() as EstreeProgram | null;
			if (program) {
				collectImportsFromEsm(program, imports);
			}
		},

		mdxJsxFlowElement: {
			filter: [],
			visit(node, ctx) {
				processJsxNode(node, ctx, metadata, imports, filePath);
			},
		},

		mdxJsxTextElement: {
			filter: [],
			visit(node, ctx) {
				processJsxNode(node, ctx, metadata, imports, filePath);
			},
		},
	});
}

export interface CompileMdxResult {
	code: string;
	astroMetadata: AstroMetadata;
}

export function createMdxProcessor(mdxOptions: MdxOptions) {
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

			const astroMetadata: AstroMetadata = {
				hydratedComponents: [],
				clientOnlyComponents: [],
				serverComponents: [],
				scripts: [],
				propagation: 'none',
				containsHead: false,
				pageOptions: {},
			};

			const collectImages = createCollectImagesPlugin(localImagePaths, remoteImagePaths);
			const headingIds = createHeadingIdsPlugin(headings, frontmatter);
			const astroMeta = createAstroMetadataPlugin(astroMetadata, filePath);

			const syntaxHighlight = mdxOptions.syntaxHighlight;
			const excludeLangs =
				typeof syntaxHighlight === 'object' ? syntaxHighlight.excludeLangs : undefined;

			const allMdastPlugins: MdastPluginDefinition[] = mdxOptions.mdastPlugins?.length
				? [collectImages, ...mdxOptions.mdastPlugins]
				: [collectImages];

			const hastPlugins: HastPluginDefinition[] = [];
			if (highlightFn) {
				hastPlugins.push(createShikiPlugin(highlightFn, excludeLangs));
			}
			hastPlugins.push(headingIds, astroMeta);
			if (mdxOptions.hastPlugins?.length) {
				hastPlugins.push(...mdxOptions.hastPlugins);
			}

			let optimizeStatic: import('satteri').MdxCompileOptions['optimizeStatic'];
			if (mdxOptions.optimize) {
				const userIgnore =
					typeof mdxOptions.optimize === 'object'
						? (mdxOptions.optimize.ignoreElementNames ?? [])
						: [];
				const componentOverrides = extractComponentOverrides(content);

				optimizeStatic = {
					component: 'Fragment',
					prop: 'set:html',
					ignoreElements: [...userIgnore, ...componentOverrides],
				};
			}

			let compiled = await mdxToJs(content, {
				mdastPlugins: allMdastPlugins,
				hastPlugins,
				optimizeStatic,
				filename: filePath,
				jsxImportSource: 'astro',
			});

			compiled = compiled.replace(/^export default MDXContent;\s*$/m, '');

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
			}

			return {
				code: compiled,
				astroMetadata,
			};
		},
	};
}
