import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, {
	type ConfigType,
	type Node,
	type NodeType,
	type RenderableTreeNode,
} from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';
// @ts-expect-error Cannot find module 'astro/runtime/server/index.js' or its corresponding type declarations.
import { createComponent, renderComponent } from 'astro/runtime/server/index.js';
import type { AstroMarkdocConfig } from './config.js';
import { setupHeadingConfig } from './heading-ids.js';

/**
 * Merge user config with default config and set up context (ex. heading ID slugger)
 * Called on each file's individual transform.
 * TODO: virtual module to merge configs per-build instead of per-file?
 */
export async function setupConfig(userConfig: AstroMarkdocConfig = {}): Promise<MergedConfig> {
	let defaultConfig: AstroMarkdocConfig = setupHeadingConfig();

	if (userConfig.extends) {
		for (let extension of userConfig.extends) {
			if (extension instanceof Promise) {
				extension = await extension;
			}

			defaultConfig = mergeConfig(defaultConfig, extension);
		}
	}

	return mergeConfig(defaultConfig, userConfig);
}

/** Used for synchronous `getHeadings()` function */
export function setupConfigSync(userConfig: AstroMarkdocConfig = {}): MergedConfig {
	const defaultConfig: AstroMarkdocConfig = setupHeadingConfig();

	return mergeConfig(defaultConfig, userConfig);
}

type MergedConfig = Required<Omit<AstroMarkdocConfig, 'extends'>>;

/** Merge function from `@markdoc/markdoc` internals */
export function mergeConfig(
	configA: AstroMarkdocConfig,
	configB: AstroMarkdocConfig
): MergedConfig {
	return {
		...configA,
		...configB,
		ctx: {
			...configA.ctx,
			...configB.ctx,
		},
		tags: {
			...configA.tags,
			...configB.tags,
		},
		nodes: {
			...configA.nodes,
			...configB.nodes,
		},
		functions: {
			...configA.functions,
			...configB.functions,
		},
		variables: {
			...configA.variables,
			...configB.variables,
		},
		partials: {
			...configA.partials,
			...configB.partials,
		},
		validation: {
			...configA.validation,
			...configB.validation,
		},
	};
}

export function resolveComponentImports(
	markdocConfig: Required<Pick<AstroMarkdocConfig, 'tags' | 'nodes'>>,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>
) {
	for (const [tag, render] of Object.entries(tagComponentMap)) {
		const config = markdocConfig.tags[tag];
		if (config) config.render = render;
	}
	for (const [node, render] of Object.entries(nodeComponentMap)) {
		const config = markdocConfig.nodes[node as NodeType];
		if (config) config.render = render;
	}
	return markdocConfig;
}

/**
 * Get text content as a string from a Markdoc transform AST
 */
export function getTextContent(childNodes: RenderableTreeNode[]): string {
	let text = '';
	for (const node of childNodes) {
		if (typeof node === 'string' || typeof node === 'number') {
			text += node;
		} else if (typeof node === 'object' && Markdoc.Tag.isTag(node)) {
			text += getTextContent(node.children);
		}
	}
	return text;
}

const headingLevels = [1, 2, 3, 4, 5, 6] as const;

/**
 * Collect headings from Markdoc transform AST
 * for `headings` result on `render()` return value
 */
export function collectHeadings(
	children: RenderableTreeNode[],
	collectedHeadings: MarkdownHeading[]
) {
	for (const node of children) {
		if (typeof node !== 'object' || !Markdoc.Tag.isTag(node)) continue;

		if (node.attributes.__collectHeading === true && typeof node.attributes.level === 'number') {
			collectedHeadings.push({
				slug: node.attributes.id,
				depth: node.attributes.level,
				text: getTextContent(node.children),
			});
			continue;
		}

		for (const level of headingLevels) {
			if (node.name === 'h' + level) {
				collectedHeadings.push({
					slug: node.attributes.id,
					depth: level,
					text: getTextContent(node.children),
				});
			}
		}
		collectHeadings(node.children, collectedHeadings);
	}
}

export function createGetHeadings(stringifiedAst: string, userConfig: AstroMarkdocConfig) {
	return function getHeadings() {
		/* Yes, we are transforming twice (once from `getHeadings()` and again from <Content /> in case of variables).
			TODO: propose new `render()` API to allow Markdoc variable passing to `render()` itself,
			instead of the Content component. Would remove double-transform and unlock variable resolution in heading slugs. */
		const config = setupConfigSync(userConfig);
		const ast = Markdoc.Ast.fromJSON(stringifiedAst);
		const content = Markdoc.transform(ast as Node, config as ConfigType);
		let collectedHeadings: MarkdownHeading[] = [];
		collectHeadings(Array.isArray(content) ? content : [content], collectedHeadings);
		return collectedHeadings;
	};
}

export function createContentComponent(
	Renderer: AstroInstance['default'],
	stringifiedAst: string,
	userConfig: AstroMarkdocConfig,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>
) {
	return createComponent({
		async factory(result: any, props: Record<string, any>) {
			const withVariables = mergeConfig(userConfig, { variables: props });
			const config = resolveComponentImports(
				await setupConfig(withVariables),
				tagComponentMap,
				nodeComponentMap
			);

			return renderComponent(result, Renderer.name, Renderer, { stringifiedAst, config }, {});
		},
		propagation: 'self',
	});
}
