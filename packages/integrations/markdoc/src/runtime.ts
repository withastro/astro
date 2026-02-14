import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, {
	type ConfigType,
	type Node,
	type NodeType,
	type RenderableTreeNode,
} from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';
import { createComponent, renderComponent } from 'astro/runtime/server/index.js';
import type { AstroMarkdocConfig } from './config.js';
import { setupHeadingConfig } from './heading-ids.js';
import { htmlTag } from './html/tagdefs/html.tag.js';
import type { MarkdocIntegrationOptions } from './options.js';
/**
 * Merge user config with default config and set up context (ex. heading ID slugger)
 * Called on each file's individual transform.
 * TODO: virtual module to merge configs per-build instead of per-file?
 */
export async function setupConfig(
	userConfig: AstroMarkdocConfig = {},
	options: MarkdocIntegrationOptions | undefined,
): Promise<MergedConfig> {
	let defaultConfig: AstroMarkdocConfig = setupHeadingConfig();

	if (userConfig.extends) {
		for (let extension of userConfig.extends) {
			if (extension instanceof Promise) {
				extension = await extension;
			}

			defaultConfig = mergeConfig(defaultConfig, extension);
		}
	}

	let merged = mergeConfig(defaultConfig, userConfig);

	if (options?.allowHTML) {
		merged = mergeConfig(merged, HTML_CONFIG);
	}

	syncTagNodeAttributes(merged);
	return merged;
}

/** Used for synchronous `getHeadings()` function */
export function setupConfigSync(
	userConfig: AstroMarkdocConfig = {},
	options: MarkdocIntegrationOptions | undefined,
): MergedConfig {
	const defaultConfig: AstroMarkdocConfig = setupHeadingConfig();

	let merged = mergeConfig(defaultConfig, userConfig);

	if (options?.allowHTML) {
		merged = mergeConfig(merged, HTML_CONFIG);
	}

	syncTagNodeAttributes(merged);
	return merged;
}

type MergedConfig = Required<Omit<AstroMarkdocConfig, 'extends'>>;

/** Merge function from `@markdoc/markdoc` internals */
export function mergeConfig(
	configA: AstroMarkdocConfig,
	configB: AstroMarkdocConfig,
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

/**
 * Sync custom attributes between tags and nodes that share the same name.
 * In Markdoc, `table` exists as both a tag (`{% table %}`) and a node (the inner
 * table structure). Attributes on the tag propagate to the child node in the AST,
 * so both schemas must declare the same attributes for validation to pass.
 * When users configure attributes on only one side, this copies them to the other.
 */
function syncTagNodeAttributes(config: MergedConfig): void {
	// Markdoc's types don't have a string index signature, so we need the explicit
	// type to index with a dynamic key in the loop below
	const builtinTags: Record<string, any> = Markdoc.tags;
	const builtinNodes: Record<string, any> = Markdoc.nodes;

	for (const name of Object.keys(builtinTags)) {
		if (!(name in builtinNodes)) continue;

		const tagSchema = config.tags[name];
		const nodeSchema = config.nodes[name as NodeType];
		const tagAttrs = tagSchema?.attributes;
		const nodeAttrs = nodeSchema?.attributes;

		// Nothing to sync if neither side has custom attributes
		if (!tagAttrs && !nodeAttrs) continue;

		const mergedAttrs = { ...tagAttrs, ...nodeAttrs };

		if (tagSchema) {
			config.tags[name] = { ...tagSchema, attributes: mergedAttrs };
		} else {
			config.tags[name] = { ...builtinTags[name], attributes: mergedAttrs };
		}

		if (nodeSchema) {
			config.nodes[name as NodeType] = { ...nodeSchema, attributes: mergedAttrs };
		} else {
			config.nodes[name as NodeType] = { ...builtinNodes[name], attributes: mergedAttrs };
		}
	}
}

/**
 * Check if a transform function respects the `render` property.
 * Astro's built-in transforms (like for headings) check `config.nodes?.X?.render`
 * to allow custom render components. Markdoc's built-in transforms do not.
 */
function transformRespectsRender(transform: { toString(): string }, configKey: string): boolean {
	const source = transform.toString();
	// Astro's transforms check config.nodes?.X?.render or config.tags?.X?.render
	return (
		source.includes(`config.nodes?.${configKey}?.render`) ||
		source.includes(`config.tags?.${configKey}?.render`)
	);
}

export function resolveComponentImports(
	markdocConfig: Required<Pick<AstroMarkdocConfig, 'tags' | 'nodes'>>,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>,
) {
	for (const [tag, render] of Object.entries(tagComponentMap)) {
		const config = markdocConfig.tags[tag];
		if (config) {
			config.render = render;
			// When a custom `render` component is specified and the transform doesn't
			// respect the render property, remove the transform so `render` wins.
			// This allows users to spread built-in Markdoc node/tag configs
			// (e.g., `...Markdoc.nodes.fence`) and override rendering with a custom component.
			// See https://github.com/withastro/astro/issues/9708
			if (config.transform && !transformRespectsRender(config.transform, tag)) {
				delete config.transform;
			}
		}
	}
	for (const [node, render] of Object.entries(nodeComponentMap)) {
		const config = markdocConfig.nodes[node as NodeType];
		if (config) {
			config.render = render;
			// When a custom `render` component is specified and the transform doesn't
			// respect the render property, remove the transform so `render` wins.
			// This allows users to spread built-in Markdoc node/tag configs
			// (e.g., `...Markdoc.nodes.fence`) and override rendering with a custom component.
			// See https://github.com/withastro/astro/issues/9708
			if (config.transform && !transformRespectsRender(config.transform, node)) {
				delete config.transform;
			}
		}
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
	collectedHeadings: MarkdownHeading[],
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

export function createGetHeadings(
	stringifiedAst: string,
	userConfig: AstroMarkdocConfig,
	options: MarkdocIntegrationOptions | undefined,
) {
	return function getHeadings() {
		/* Yes, we are transforming twice (once from `getHeadings()` and again from <Content /> in case of variables).
			TODO: propose new `render()` API to allow Markdoc variable passing to `render()` itself,
			instead of the Content component. Would remove double-transform and unlock variable resolution in heading slugs. */
		const config = setupConfigSync(userConfig, options);
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
	options: MarkdocIntegrationOptions | undefined,
	tagComponentMap: Record<string, AstroInstance['default']>,
	nodeComponentMap: Record<NodeType, AstroInstance['default']>,
) {
	return createComponent({
		async factory(result: any, props: Record<string, any>) {
			const withVariables = mergeConfig(userConfig, { variables: props });
			const config = resolveComponentImports(
				await setupConfig(withVariables, options),
				tagComponentMap,
				nodeComponentMap,
			);

			return renderComponent(result, Renderer.name, Renderer, { stringifiedAst, config }, {});
		},
		propagation: 'self',
	} as any);
}

// statically define a partial MarkdocConfig which registers the required "html-tag" Markdoc tag when the "allowHTML" feature is enabled
const HTML_CONFIG: AstroMarkdocConfig = {
	tags: {
		'html-tag': htmlTag,
	},
};
