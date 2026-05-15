import { createCssVariablesTheme, createHighlighter, isSpecialLang } from 'shiki';
import { loadShikiEngine } from '#shiki-engine';
let _cssVariablesTheme;
const cssVariablesTheme = () =>
	_cssVariablesTheme ??
	(_cssVariablesTheme = createCssVariablesTheme({
		variablePrefix: '--astro-code-',
	}));
const cachedHighlighters = /* @__PURE__ */ new Map();
function clearShikiHighlighterCache() {
	cachedHighlighters.clear();
}
function createShikiHighlighter(options) {
	const key = getCacheKey(options);
	let highlighterPromise = cachedHighlighters.get(key);
	if (!highlighterPromise) {
		highlighterPromise = createShikiHighlighterInternal(options);
		cachedHighlighters.set(key, highlighterPromise);
	}
	return ensureLanguagesLoaded(highlighterPromise, options?.langs);
}
function getCacheKey(options) {
	const keyCache = [];
	const { theme, themes, langAlias } = options ?? {};
	if (theme) {
		keyCache.push(theme);
	}
	if (themes) {
		keyCache.push(Object.entries(themes).sort());
	}
	if (langAlias) {
		keyCache.push(Object.entries(langAlias).sort());
	}
	return keyCache.length > 0 ? JSON.stringify(keyCache) : '';
}
async function ensureLanguagesLoaded(promise, langs) {
	const highlighter = await promise;
	if (!langs) {
		return highlighter;
	}
	const loadedLanguages = highlighter.getLoadedLanguages();
	for (const lang of langs) {
		if (typeof lang === 'string' && (isSpecialLang(lang) || loadedLanguages.includes(lang))) {
			continue;
		}
		await highlighter.loadLanguage(lang);
	}
	return highlighter;
}
let shikiEngine = void 0;
async function createShikiHighlighterInternal({
	langs = [],
	theme = 'github-dark',
	themes = {},
	langAlias = {},
} = {}) {
	theme = theme === 'css-variables' ? cssVariablesTheme() : theme;
	if (shikiEngine === void 0) {
		shikiEngine = await loadShikiEngine();
	}
	const highlighter = await createHighlighter({
		langs: ['plaintext', ...langs],
		langAlias,
		themes: Object.values(themes).length ? Object.values(themes) : [theme],
		engine: shikiEngine,
	});
	async function highlight(code, lang = 'plaintext', options, to) {
		const resolvedLang = langAlias[lang] ?? lang;
		const loadedLanguages = highlighter.getLoadedLanguages();
		if (!isSpecialLang(lang) && !loadedLanguages.includes(resolvedLang)) {
			try {
				await highlighter.loadLanguage(resolvedLang);
			} catch (_err) {
				const langStr =
					lang === resolvedLang ? `"${lang}"` : `"${lang}" (aliased to "${resolvedLang}")`;
				console.warn(`[Shiki] The language ${langStr} doesn't exist, falling back to "plaintext".`);
				lang = 'plaintext';
			}
		}
		code = code.replace(/(?:\r\n|\r|\n)$/, '');
		const themeOptions = Object.values(themes).length ? { themes } : { theme };
		const inline = options?.inline ?? false;
		return highlighter[to === 'html' ? 'codeToHtml' : 'codeToHast'](code, {
			...themeOptions,
			defaultColor: options.defaultColor,
			lang,
			// NOTE: while we can spread `options.attributes` here so that Shiki can auto-serialize this as rendered
			// attributes on the top-level tag, it's not clear whether it is fine to pass all attributes as meta, as
			// they're technically neither meta nor parsed from Shiki's `parseMetaString` API.
			meta: options?.meta ? { __raw: options?.meta } : void 0,
			transformers: [
				{
					pre(node) {
						if (inline) {
							node.tagName = 'code';
						}
						const {
							class: attributesClass,
							style: attributesStyle,
							...rest
						} = options?.attributes ?? {};
						Object.assign(node.properties, rest);
						const classValue =
							(normalizePropAsString(node.properties.class) ?? '') +
							(attributesClass ? ` ${attributesClass}` : '');
						const styleValue =
							(normalizePropAsString(node.properties.style) ?? '') +
							(attributesStyle ? `; ${attributesStyle}` : '');
						node.properties.class = classValue.replace(/shiki/g, 'astro-code');
						node.properties.dataLanguage = lang;
						if (options.wrap === false || options.wrap === void 0) {
							node.properties.style = styleValue + '; overflow-x: auto;';
						} else if (options.wrap === true) {
							node.properties.style =
								styleValue + '; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
						}
					},
					line(node) {
						if (resolvedLang === 'diff') {
							const innerSpanNode = node.children[0];
							const innerSpanTextNode =
								innerSpanNode?.type === 'element' && innerSpanNode.children?.[0];
							if (innerSpanTextNode && innerSpanTextNode.type === 'text') {
								const start = innerSpanTextNode.value[0];
								if (start === '+' || start === '-') {
									innerSpanTextNode.value = innerSpanTextNode.value.slice(1);
									innerSpanNode.children.unshift({
										type: 'element',
										tagName: 'span',
										properties: { style: 'user-select: none;' },
										children: [{ type: 'text', value: start }],
									});
								}
							}
						}
					},
					code(node) {
						if (inline) {
							return node.children[0];
						}
					},
				},
				...(options.transformers ?? []),
			],
		});
	}
	return {
		codeToHast(code, lang, options = {}) {
			return highlight(code, lang, options, 'hast');
		},
		codeToHtml(code, lang, options = {}) {
			return highlight(code, lang, options, 'html');
		},
		loadLanguage(...newLangs) {
			return highlighter.loadLanguage(...newLangs);
		},
		getLoadedLanguages() {
			return highlighter.getLoadedLanguages();
		},
	};
}
function normalizePropAsString(value) {
	return Array.isArray(value) ? value.join(' ') : value;
}
export { clearShikiHighlighterCache, createShikiHighlighter };
