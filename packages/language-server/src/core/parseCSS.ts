import type { TSXExtractedStyle } from '@astrojs/compiler/types';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import { Segment, toString } from 'muggle-string';
import { buildMappings } from '../buildMappings.js';

export function extractStylesheets(styles: TSXExtractedStyle[]): VirtualCode {
	return mergeCSSContexts(styles);
}

function mergeCSSContexts(inlineStyles: TSXExtractedStyle[]): VirtualCode {
	const codes: Segment<CodeInformation>[] = [];

	for (const cssContext of inlineStyles) {
		const isStyleAttribute = cssContext.type === 'style-attribute';
		if (isStyleAttribute) codes.push('__ { ');
		codes.push([
			cssContext.content,
			undefined,
			cssContext.position.start,
			{
				verification: false,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		]);
		if (isStyleAttribute) codes.push(' }\n');
	}

	const mappings = buildMappings(codes);
	const text = toString(codes);

	return {
		id: 'style.css',
		languageId: 'css',
		snapshot: {
			getText: (start, end) => text.substring(start, end),
			getLength: () => text.length,
			getChangeRange: () => undefined,
		},
		embeddedCodes: [],
		mappings,
	};
}
