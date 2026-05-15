interface ParsedI18nUrl {
	locale: string;
	path: string;
}
export declare function parseI18nUrl(
	url: string,
	defaultLocale: string,
	locales: Record<string, string>,
	base: string,
): ParsedI18nUrl | undefined;
export {};
