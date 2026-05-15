export declare function runHighlighterWithAstro(
	lang: string | undefined,
	code: string,
): Promise<{
	classLanguage: string;
	html: string;
}>;
