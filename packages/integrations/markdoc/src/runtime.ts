import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, {
	type ConfigType as MarkdocConfig,
	type RenderableTreeNode,
} from '@markdoc/markdoc';
import type { ContentEntryModule } from 'astro';
import { nodes as astroNodes } from './nodes/index.js';

/** Used to reset Slugger cache on each build at runtime */
export { default as Markdoc } from '@markdoc/markdoc';
export { headingSlugger } from './nodes/index.js';

export function applyDefaultConfig(
	config: MarkdocConfig,
	entry: ContentEntryModule
): MarkdocConfig {
	return {
		...config,
		variables: {
			entry,
			...config.variables,
		},
		nodes: {
			...astroNodes,
			...config.nodes,
		},
		// TODO: Syntax highlighting
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
