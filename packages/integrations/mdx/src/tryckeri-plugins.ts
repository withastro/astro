import * as path from 'node:path';
import {
	defineMdastPlugin,
	defineHastPlugin,
	compileMdxToJs,
	type MdastNode,
	type HastNode,
	type HastVisitorContext,
	type MdastPluginDefinition,
	type HastPluginDefinition,
} from 'tryckeri';
import Slugger from 'github-slugger';

export type { MdastPluginDefinition, HastPluginDefinition };

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

interface CollectedMdxData {
	headings: MarkdownHeading[];
	localImagePaths: string[];
	remoteImagePaths: string[];
}

// --- Reusable plugin definitions (created once, not per file) ---

const collectImagesPlugin = defineMdastPlugin({
	name: 'collect-images',
	createOnce() {
		return {
			image(node: MdastNode) {
				const url = node.url ? decodeURI(node.url) : undefined;
				if (!url) return;

				if (URL.canParse(url)) {
					_remoteImagePaths!.add(url);
				} else if (!url.startsWith('/')) {
					_localImagePaths!.add(url);
				}
			},
		};
	},
});

// Module-level refs set before each compile — avoids closure allocation per file
let _localImagePaths: Set<string> | null = null;
let _remoteImagePaths: Set<string> | null = null;
let _headings: MarkdownHeading[] | null = null;
let _frontmatter: Record<string, any> | undefined = undefined;
let _filePath: string = '';
let _astroMetadata: AstroMetadata | null = null;
let _highlightFn: HighlightFn | undefined = undefined;
let _excludeLangs: string[] | undefined = undefined;

// --- Heading IDs HAST plugin ---

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

function collectHastText(node: HastNode): string {
	let text = '';
	if (node.type === 'mdxExpression' && node.value != null && _frontmatter) {
		const resolved = resolveFrontmatterExpression(node.value.trim(), _frontmatter);
		text += resolved ?? node.value;
	} else if (node.value != null) {
		text += node.value;
	}
	if (node.children) {
		for (const child of node.children) {
			text += collectHastText(child);
		}
	}
	return text;
}

const headingTagNames = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const _slugger = new Slugger();

const headingIdsPlugin = defineHastPlugin({
	name: 'heading-ids',
	createOnce() {
		return {
			before() {
				_slugger.reset();
			},
			element(node: HastNode, ctx: HastVisitorContext) {
				if (!node.tagName || !headingTagNames.has(node.tagName)) return;

				const text = collectHastText(node);
				const slug = _slugger.slug(text);
				const depth = parseInt(node.tagName[1], 10);
				_headings!.push({ depth, slug, text });
				ctx.setProperty(node, 'id', slug);
			},
		};
	},
});

// --- Shiki syntax highlighting MDAST plugin ---

const defaultExcludeLanguages = ['math'];

export type HighlightFn = (code: string, lang: string, meta?: string) => string;

const shikiPlugin = defineMdastPlugin({
	name: 'shiki-highlight',
	createOnce() {
		return {
			code(node: MdastNode) {
				if (!_highlightFn) return;
				const lang = node.lang || 'plaintext';
				if (
					(_excludeLangs && _excludeLangs.includes(lang)) ||
					defaultExcludeLanguages.includes(lang)
				) {
					return;
				}

				const code = (node.value || '').replace(/\n$/, '');
				const html = _highlightFn(code, lang, node.meta ?? undefined);
				return { rawHtml: html };
			},
		};
	},
});

// --- Astro metadata HAST plugin ---

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

function parseImportStatement(source: string): { specifiers: ImportSpecifier[]; path: string } | undefined {
	const match = source.match(
		/^import\s+(?:(.+?)\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/,
	);
	if (!match) return undefined;

	const [, specPart, importPath] = match;
	if (!specPart) return { specifiers: [], path: importPath };

	const specifiers: ImportSpecifier[] = [];

	const nsMatch = specPart.match(/^\*\s+as\s+(\w+)$/);
	if (nsMatch) {
		specifiers.push({ local: nsMatch[1], imported: '*' });
		return { specifiers, path: importPath };
	}

	const braceMatch = specPart.match(/^([^{]*?)(?:\{([^}]*)\})?$/);
	if (!braceMatch) return { specifiers: [], path: importPath };

	const defaultPart = braceMatch[1].replace(/,\s*$/, '').trim();
	const namedPart = braceMatch[2];

	if (defaultPart) {
		specifiers.push({ local: defaultPart, imported: 'default' });
	}

	if (namedPart) {
		for (const spec of namedPart.split(',')) {
			const trimmed = spec.trim();
			if (!trimmed) continue;
			const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
			if (aliasMatch) {
				specifiers.push({ local: aliasMatch[2], imported: aliasMatch[1] });
			} else {
				specifiers.push({ local: trimmed, imported: trimmed });
			}
		}
	}

	return { specifiers, path: importPath };
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

function hasDirective(node: HastNode, prefix: string): boolean {
	const attrs = node.attributes;
	if (!attrs) return false;
	for (let i = 0; i < attrs.length; i++) {
		const a = attrs[i];
		if (a.type === 'mdxJsxAttribute' && a.name.startsWith(prefix)) return true;
	}
	return false;
}

function findAttrValue(node: HastNode, name: string): string | null {
	const attrs = node.attributes;
	if (!attrs) return null;
	for (let i = 0; i < attrs.length; i++) {
		const a = attrs[i];
		if (a.type === 'mdxJsxAttribute' && a.name === name) {
			return typeof a.value === 'string' ? a.value : null;
		}
	}
	return null;
}

// Shared imports map — reused across files, cleared in before()
const _imports = new Map<string, Set<ImportSpecifier>>();

const astroMetadataPlugin = defineHastPlugin({
	name: 'astro-metadata',
	createOnce() {
		return {
			before() {
				_imports.clear();
				if (_astroMetadata) {
					_astroMetadata.hydratedComponents.length = 0;
					_astroMetadata.clientOnlyComponents.length = 0;
					_astroMetadata.serverComponents.length = 0;
				}
			},

			mdxjsEsm(node: HastNode) {
				if (!node.value) return;
				const parsed = parseImportStatement(node.value);
				if (!parsed) return;

				let specSet = _imports.get(parsed.path);
				if (!specSet) {
					specSet = new Set();
					_imports.set(parsed.path, specSet);
				}
				for (const spec of parsed.specifiers) {
					specSet.add(spec);
				}
			},

			mdxJsxElement(node: HastNode, ctx: HastVisitorContext) {
				processJsxNode(node, ctx);
			},

			mdxJsxTextElement(node: HastNode, ctx: HastVisitorContext) {
				processJsxNode(node, ctx);
			},
		};
	},
});

function processJsxNode(
	node: HastNode,
	ctx: HastVisitorContext,
) {
	const tagName = node.name;
	if (!tagName || !isComponent(tagName)) return;

	const hasClient = hasDirective(node, 'client:');
	const hasServerDefer = !hasClient && hasDirective(node, 'server:defer');
	if (!hasClient && !hasServerDefer) return;

	const metadata = _astroMetadata!;

	const matchedImport = findMatchingImport(tagName, _imports);
	if (!matchedImport) {
		throw new Error(
			`Expected a matching import for component \`${tagName}\`. Did you forget to import it?`,
		);
	}

	if (matchedImport.path.endsWith('.astro') && hasClient) {
		const clientAttr = findAttrValue(node, 'client:load') !== null ? 'client:load'
			: findAttrValue(node, 'client:idle') !== null ? 'client:idle'
			: findAttrValue(node, 'client:visible') !== null ? 'client:visible'
			: findAttrValue(node, 'client:only') !== null ? 'client:only'
			: 'client:*';
		console.warn(
			`You are attempting to render <${tagName} ${clientAttr} />, but ${tagName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
		);
	}

	const resolvedPath = resolveImportPath(matchedImport.path, _filePath);
	const exportName = matchedImport.name === '*'
		? tagName.split('.').slice(1).join('.')
		: matchedImport.name;

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

// --- Optimize static helpers ---

const exportConstComponentsRe = /export\s+const\s+components\s*=\s*\{([^}]*)\}/;

function extractComponentOverrides(content: string): string[] {
	const match = exportConstComponentsRe.exec(content);
	if (!match) return [];
	const body = match[1];
	const keys: string[] = [];
	for (const part of body.split(',')) {
		const keyMatch = part.trim().match(/^(\w+)\s*:/);
		if (keyMatch) {
			keys.push(keyMatch[1]);
		}
	}
	return keys;
}

// --- Pre-built plugin arrays (avoids allocation per file) ---

const mdastPluginsBase: MdastPluginDefinition[] = [collectImagesPlugin];
const mdastPluginsWithShiki: MdastPluginDefinition[] = [collectImagesPlugin, shikiPlugin];
const hastPluginsBase: HastPluginDefinition[] = [headingIdsPlugin, astroMetadataPlugin];

// --- Main compile function ---

export interface CompileMdxWithPluginsOptions {
	filePath: string;
	frontmatter?: Record<string, any>;
	highlight?: HighlightFn;
	excludeLangs?: string[];
	optimize?: boolean | { ignoreElementNames?: string[] };
	mdastPlugins?: MdastPluginDefinition[];
	hastPlugins?: HastPluginDefinition[];
}

export interface CompileMdxResult {
	code: string;
	data: CollectedMdxData;
	astroMetadata: AstroMetadata;
}

export function compileMdxWithPlugins(
	content: string,
	options: CompileMdxWithPluginsOptions,
): CompileMdxResult {
	const headings: MarkdownHeading[] = [];
	const localImagePaths = new Set<string>();
	const remoteImagePaths = new Set<string>();

	// Set module-level refs for plugins to use (avoids closure allocation)
	_headings = headings;
	_localImagePaths = localImagePaths;
	_remoteImagePaths = remoteImagePaths;
	_frontmatter = options.frontmatter;
	_filePath = options.filePath;
	_highlightFn = options.highlight;
	_excludeLangs = options.excludeLangs;

	const astroMetadata: AstroMetadata = {
		hydratedComponents: [],
		clientOnlyComponents: [],
		serverComponents: [],
		scripts: [],
		propagation: 'none',
		containsHead: false,
		pageOptions: {},
	};
	_astroMetadata = astroMetadata;

	// Use pre-built plugin arrays when no user plugins
	const builtinMdast = options.highlight ? mdastPluginsWithShiki : mdastPluginsBase;
	const allMdastPlugins = options.mdastPlugins
		? [...builtinMdast, ...options.mdastPlugins]
		: builtinMdast;

	const allHastPlugins = options.hastPlugins
		? [...hastPluginsBase, ...options.hastPlugins]
		: hastPluginsBase;

	// Build optimizeStatic config if enabled
	let optimizeStatic: import('tryckeri').CompileOptions['optimizeStatic'];
	if (options.optimize) {
		const userIgnore = typeof options.optimize === 'object'
			? options.optimize.ignoreElementNames ?? []
			: [];
		const componentOverrides = extractComponentOverrides(content);

		optimizeStatic = {
			component: 'Fragment',
			prop: 'set:html',
			ignoreElements: [...userIgnore, ...componentOverrides],
		};
	}

	const code = compileMdxToJs(content, {
		mdastPlugins: allMdastPlugins,
		hastPlugins: allHastPlugins,
		optimizeStatic,
	});

	// Clear refs
	_headings = null;
	_localImagePaths = null;
	_remoteImagePaths = null;
	_astroMetadata = null;

	return {
		code,
		data: {
			headings,
			localImagePaths: [...localImagePaths],
			remoteImagePaths: [...remoteImagePaths],
		},
		astroMetadata,
	};
}
