import { ExtractedStyleType, type ExtractedStyle } from '@astrojs/astro2tsx';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import { buildMappings, getText, type CodeSegment } from '../buildMappings.js';

const SUPPORTED_LANGUAGES = ['css', 'scss', 'less'] as const;
type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(lang: string): lang is SupportedLanguages {
	return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguages);
}

export function extractStylesheets(styles: ExtractedStyle[]): VirtualCode[] {
	return mergeCSSContextsByLanguage(styles);
}

function mergeCSSContextsByLanguage(inlineStyles: ExtractedStyle[]): VirtualCode[] {
	const codes: Record<SupportedLanguages, CodeSegment<CodeInformation>[]> = {
		css: [],
		scss: [],
		less: [],
	};

	for (const cssContext of inlineStyles) {
		const currentCode = isSupportedLanguage(cssContext.lang) ? codes[cssContext.lang] : codes.css;

		const isStyleAttribute = cssContext.type === ExtractedStyleType.StyleAttribute;
		if (isStyleAttribute) currentCode.push('__ { ');
		currentCode.push({
			text: cssContext.content,
			start: cssContext.position.start,
			end: cssContext.position.start + cssContext.content.length,
			data: {
				verification: false,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		});
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

function createVirtualCodeForLanguage(
	code: CodeSegment<CodeInformation>[],
	lang: string,
): VirtualCode {
	const mappings = buildMappings(code);
	const text = getText(code);

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
