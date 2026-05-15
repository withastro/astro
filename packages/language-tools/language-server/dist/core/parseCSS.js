'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractStylesheets = extractStylesheets;
const muggle_string_1 = require('muggle-string');
const buildMappings_js_1 = require('../buildMappings.js');
const SUPPORTED_LANGUAGES = ['css', 'scss', 'less'];
function isSupportedLanguage(lang) {
	return SUPPORTED_LANGUAGES.includes(lang);
}
function extractStylesheets(styles) {
	return mergeCSSContextsByLanguage(styles);
}
function mergeCSSContextsByLanguage(inlineStyles) {
	const codes = {
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
	let virtualCodes = [];
	for (const lang of SUPPORTED_LANGUAGES) {
		if (codes[lang].length) {
			virtualCodes.push(createVirtualCodeForLanguage(codes[lang], lang));
		}
	}
	return virtualCodes;
}
function createVirtualCodeForLanguage(code, lang) {
	const mappings = (0, buildMappings_js_1.buildMappings)(code);
	const text = (0, muggle_string_1.toString)(code);
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
//# sourceMappingURL=parseCSS.js.map
