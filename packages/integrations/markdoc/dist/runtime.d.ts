import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { type NodeType, type RenderableTreeNode } from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';
import type { AstroMarkdocConfig } from './config.js';
import type { MarkdocIntegrationOptions } from './options.js';
/**
 * Merge user config with default config and set up context (ex. heading ID slugger)
 * Called on each file's individual transform.
 * TODO: virtual module to merge configs per-build instead of per-file?
 */
export declare function setupConfig(
	userConfig: AstroMarkdocConfig | undefined,
	options: MarkdocIntegrationOptions | undefined,
): Promise<MergedConfig>;
/** Used for synchronous `getHeadings()` function */
export declare function setupConfigSync(
	userConfig: AstroMarkdocConfig | undefined,
	options: MarkdocIntegrationOptions | undefined,
): MergedConfig;
type MergedConfig = Required<Omit<AstroMarkdocConfig, 'extends'>>;
/** Merge function from `@markdoc/markdoc` internals */
export declare function mergeConfig(
	configA: AstroMarkdocConfig,
	configB: AstroMarkdocConfig,
): MergedConfig;
export declare function resolveComponentImports(
	markdocConfig: Required<Pick<AstroMarkdocConfig, 'tags' | 'nodes'>>,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>,
): Required<Pick<AstroMarkdocConfig, 'nodes' | 'tags'>>;
/**
 * Get text content as a string from a Markdoc transform AST
 */
export declare function getTextContent(childNodes: RenderableTreeNode[]): string;
/**
 * Collect headings from Markdoc transform AST
 * for `headings` result on `render()` return value
 */
export declare function collectHeadings(
	children: RenderableTreeNode[],
	collectedHeadings: MarkdownHeading[],
): void;
export declare function createGetHeadings(
	stringifiedAst: string,
	userConfig: AstroMarkdocConfig,
	options: MarkdocIntegrationOptions | undefined,
): () => MarkdownHeading[];
export declare function createContentComponent(
	Renderer: AstroInstance['default'],
	stringifiedAst: string,
	userConfig: AstroMarkdocConfig,
	options: MarkdocIntegrationOptions | undefined,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>,
): import('astro/runtime/server/index.js').AstroComponentFactory;
export {};
