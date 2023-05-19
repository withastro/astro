import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, {
	type ConfigType as MarkdocConfig,
	type RenderableTreeNode,
} from '@markdoc/markdoc';
import type { ContentEntryModule } from 'astro';
import { setupHeadingConfig } from './nodes/index.js';

/** Used to call `Markdoc.transform()` and `Markdoc.Ast` in runtime modules */
export { default as Markdoc } from '@markdoc/markdoc';

/**
 * Merge user config with default config and set up context (ex. heading ID slugger)
 * Called on each file's individual transform
 */
export function setupConfig(userConfig: MarkdocConfig, entry: ContentEntryModule): MarkdocConfig {
	const defaultConfig: MarkdocConfig = {
		// `setupXConfig()` could become a "plugin" convention as well?
		...setupHeadingConfig(),
		variables: { entry },
	};
	return mergeConfig(defaultConfig, userConfig);
}

/** Merge function from `@markdoc/markdoc` internals */
function mergeConfig(configA: MarkdocConfig, configB: MarkdocConfig): MarkdocConfig {
	return {
		...configA,
		...configB,
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
	};
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
export function collectHeadings(children: RenderableTreeNode[]): MarkdownHeading[] {
	let collectedHeadings: MarkdownHeading[] = [];
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
		collectedHeadings.concat(collectHeadings(node.children));
	}
	return collectedHeadings;
}
