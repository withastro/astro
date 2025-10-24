import type { TSXExtractedStyle } from '@astrojs/compiler/types';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import type { Segment } from 'muggle-string';
import { toString } from 'muggle-string';
import { buildMappings } from '../buildMappings.js';

const SUPPORTED_LANGUAGES = ['css', 'scss', 'less'] as const;
type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(lang: string): lang is SupportedLanguages {
	return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguages);
}

export function extractStylesheets(styles: TSXExtractedStyle[]): VirtualCode[] {
	return mergeCSSContextsByLanguage(styles);
}

function mergeCSSContextsByLanguage(inlineStyles: TSXExtractedStyle[]): VirtualCode[] {
	const codes: Record<SupportedLanguages, Segment<CodeInformation>[]> = {
		css: [],
		scss: [],
		less: [],
	};

	for (const cssContext of inlineStyles) {
		const currentCode = isSupportedLanguage(cssContext.lang) ? codes[cssContext.lang] : codes.css;

		const isStyleAttribute = cssContext.type === 'style-attribute';
		if (isStyleAttribute) currentCode.push('__ { ');
		currentCode.push([
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
		if (isStyleAttribute) currentCode.push(' }\n');
	}

	let virtualCodes: VirtualCode[] = [];
	for (const lang of SUPPORTED_LANGUAGES) {
		if (codes[lang].length) {
			virtualCodes.push(createVirtualCodeForLanguage(codes[lang], lang));
		}
	}

	return virtualCodes;
}

function createVirtualCodeForLanguage(code: Segment<CodeInformation>[], lang: string): VirtualCode {
	const mappings = buildMappings(code);
	const text = toString(code);

	return {
		id: `style.${lang}`,
		languageId: lang,
		snapshot: {
			getText: (start, end) => text.substring(start, end),
			getLength: () => text.length,
			getChangeRange: () => undefined,
		},
		embeddedCodes: [],
		mappings,
	};
}
