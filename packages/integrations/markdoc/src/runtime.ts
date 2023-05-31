import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import type { ContentEntryModule } from 'astro';
import type { AstroMarkdocConfig } from './config.js';
import { setupHeadingConfig } from './heading-ids.js';

/** Used to call `Markdoc.transform()` and `Markdoc.Ast` in runtime modules */
export { default as Markdoc } from '@markdoc/markdoc';

/**
 * Merge user config with default config and set up context (ex. heading ID slugger)
 * Called on each file's individual transform.
 * TODO: virtual module to merge configs per-build instead of per-file?
 */
export async function setupConfig(
	userConfig: AstroMarkdocConfig
): Promise<Omit<AstroMarkdocConfig, 'extends'>> {
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
export function setupConfigSync(
	userConfig: AstroMarkdocConfig
): Omit<AstroMarkdocConfig, 'extends'> {
	const defaultConfig: AstroMarkdocConfig = setupHeadingConfig();

	return mergeConfig(defaultConfig, userConfig);
}

/** Merge function from `@markdoc/markdoc` internals */
function mergeConfig(configA: AstroMarkdocConfig, configB: AstroMarkdocConfig): AstroMarkdocConfig {
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
