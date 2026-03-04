import type { Properties, Root } from 'hast';
import {
	type BuiltinLanguage,
	type BundledLanguage,
	createCssVariablesTheme,
	createHighlighter,
	type HighlighterCoreOptions,
	isSpecialLang,
	type LanguageInput,
	type LanguageRegistration,
	type RegexEngine,
	type ShikiTransformer,
	type SpecialLanguage,
	type ThemeRegistration,
	type ThemeRegistrationRaw,
} from 'shiki';
import type { ThemePresets } from './types.js';
import { loadShikiEngine } from '#shiki-engine';

export interface ShikiHighlighter {
	codeToHast(
		code: string,
		lang?: string,
		options?: ShikiHighlighterHighlightOptions,
	): Promise<Root>;
	codeToHtml(
		code: string,
		lang?: string,
		options?: ShikiHighlighterHighlightOptions,
	): Promise<string>;
}

type ShikiLanguage = LanguageInput | BuiltinLanguage | SpecialLanguage;

interface ShikiHighlighterInternal extends ShikiHighlighter {
	loadLanguage(...langs: ShikiLanguage[]): Promise<void>;
	getLoadedLanguages(): string[];
}

export interface CreateShikiHighlighterOptions {
	langs?: LanguageRegistration[];
	theme?: ThemePresets | ThemeRegistration | ThemeRegistrationRaw;
	themes?: Record<string, ThemePresets | ThemeRegistration | ThemeRegistrationRaw>;
	langAlias?: HighlighterCoreOptions['langAlias'];
}

export interface ShikiHighlighterHighlightOptions {
	/**
	 * Generate inline code element only, without the pre element wrapper.
	 */
	inline?: boolean;
	/**
	 * Enable word wrapping.
	 * - true: enabled.
	 * - false: disabled.
	 * - null: All overflow styling removed. Code will overflow the element by default.
	 */
	wrap?: boolean | null;
	/**
	 * Chooses a theme from the "themes" option that you've defined as the default styling theme.
	 */
	defaultColor?: 'light' | 'dark' | string | false;
	/**
	 * Shiki transformers to customize the generated HTML by manipulating the hast tree.
	 */
	transformers?: ShikiTransformer[];
	/**
	 * Additional attributes to be added to the root code block element.
	 */
	attributes?: Record<string, string>;
	/**
	 * Raw `meta` information to be used by Shiki transformers.
	 */
	meta?: string;
}

let _cssVariablesTheme: ReturnType<typeof createCssVariablesTheme>;
const cssVariablesTheme = () =>
	_cssVariablesTheme ??
	(_cssVariablesTheme = createCssVariablesTheme({
		variablePrefix: '--astro-code-',
	}));

// Caches Promise<ShikiHighlighterInternal> for reuse when the same `themes` and `langAlias`.
const cachedHighlighters = new Map<string, Promise<ShikiHighlighterInternal>>();

/**
 * Only used for testing.
 *
 * @internal
 */
export function clearShikiHighlighterCache(): void {
	cachedHighlighters.clear();
}

export function createShikiHighlighter(
	options?: CreateShikiHighlighterOptions,
): Promise<ShikiHighlighter> {
	// Although this function returns a promise, its body runs synchronously so
	// that the cache lookup happens immediately. Without this, calling
	// `Promise.all([createShikiHighlighter(), createShikiHighlighter()])` would
	// bypass the cache and create duplicate highlighters.

	const key: string = getCacheKey(options);
	let highlighterPromise = cachedHighlighters.get(key);
	if (!highlighterPromise) {
		highlighterPromise = createShikiHighlighterInternal(options);
		cachedHighlighters.set(key, highlighterPromise);
	}
	return ensureLanguagesLoaded(highlighterPromise, options?.langs);
}

/**
 * Gets the cache key for the highlighter.
 *
 * Notice that we don't use `langs` in the cache key because we can dynamically
 * load languages. This allows us to reuse the same highlighter instance for
 * different languages.
 */
function getCacheKey(options?: CreateShikiHighlighterOptions): string {
	const keyCache: unknown[] = [];
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

/**
 * Ensures that the languages are loaded into the highlighter. This is
 * especially important when the languages are objects representing custom
 * user-defined languages.
 */
async function ensureLanguagesLoaded(
	promise: Promise<ShikiHighlighterInternal>,
	langs?: ShikiLanguage[],
): Promise<ShikiHighlighterInternal> {
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

let shikiEngine: RegexEngine | undefined = undefined;

async function createShikiHighlighterInternal({
	langs = [],
	theme = 'github-dark',
	themes = {},
	langAlias = {},
}: CreateShikiHighlighterOptions = {}): Promise<ShikiHighlighterInternal> {
	theme = theme === 'css-variables' ? cssVariablesTheme() : theme;

	if (shikiEngine === undefined) {
		shikiEngine = await loadShikiEngine();
	}

	const highlighter = await createHighlighter({
		langs: ['plaintext', ...langs],
		langAlias,
		themes: Object.values(themes).length ? Object.values(themes) : [theme],
		engine: shikiEngine,
	});

	async function highlight(
		code: string,
		lang = 'plaintext',
		options: ShikiHighlighterHighlightOptions,
		to: 'hast' | 'html',
	) {
		const resolvedLang = langAlias[lang] ?? lang;
		const loadedLanguages = highlighter.getLoadedLanguages();

		if (!isSpecialLang(lang) && !loadedLanguages.includes(resolvedLang)) {
			try {
				await highlighter.loadLanguage(resolvedLang as BundledLanguage);
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
			// they're technically not meta, nor parsed from Shiki's `parseMetaString` API.
			meta: options?.meta ? { __raw: options?.meta } : undefined,
			transformers: [
				{
					pre(node) {
						// Swap to `code` tag if inline
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

						// Replace "shiki" class naming with "astro-code"
						node.properties.class = classValue.replace(/shiki/g, 'astro-code');

						// Add data-language attribute
						node.properties.dataLanguage = lang;

						// Handle code wrapping
						// if wrap=null, do nothing.
						if (options.wrap === false || options.wrap === undefined) {
							node.properties.style = styleValue + '; overflow-x: auto;';
						} else if (options.wrap === true) {
							node.properties.style =
								styleValue + '; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
						}
					},
					line(node) {
						// Add "user-select: none;" for "+"/"-" diff symbols.
						// Transform `<span class="line"><span style="...">+ something</span></span>
						// into      `<span class="line"><span style="..."><span style="user-select: none;">+</span> something</span></span>`
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
							return node.children[0] as typeof node;
						}
					},
				},
				...(options.transformers ?? []),
			],
		});
	}

	return {
		codeToHast(code, lang, options = {}) {
			return highlight(code, lang, options, 'hast') as Promise<Root>;
		},
		codeToHtml(code, lang, options = {}) {
			return highlight(code, lang, options, 'html') as Promise<string>;
		},
		loadLanguage(...newLangs) {
			return highlighter.loadLanguage(...newLangs);
		},
		getLoadedLanguages() {
			return highlighter.getLoadedLanguages();
		},
	};
}

function normalizePropAsString(value: Properties[string]): string | null {
	return Array.isArray(value) ? value.join(' ') : (value as string | null);
}

// Re-export ThemePresets type for consumers
export type { ThemePresets };
