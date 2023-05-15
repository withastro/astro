import type { ConfigType as MarkdocConfig } from '@markdoc/markdoc';
import type { ContentEntryModule } from 'astro';
import { createHeadingNode } from './nodes/index.js';
import type { MarkdownHeading } from '@astrojs/markdown-remark';

export function applyDefaultConfig(
	config: MarkdocConfig,
	entry: ContentEntryModule
): { collectedHeadings: MarkdownHeading[]; config: MarkdocConfig } {
	const headingNode = createHeadingNode();
	return {
		collectedHeadings: headingNode.headings,
		config: {
			...config,
			variables: {
				entry,
				...config.variables,
			},
			nodes: {
				heading: headingNode.schema,
				...config.nodes,
			},
			// TODO: Syntax highlighting
		},
	};
}
