import { KNOWN_LANGUAGES, KNOWN_LANGUAGE_CODES } from './config';
export { KNOWN_LANGUAGES, KNOWN_LANGUAGE_CODES };

export const langPathRegex = /\/([a-z]{2}-?[A-Z]{0,2})\//;

export function getLanguageFromURL(pathname: string) {
	const langCodeMatch = pathname.match(langPathRegex);
	const langCode = langCodeMatch ? langCodeMatch[1] : 'en';
	return langCode as typeof KNOWN_LANGUAGE_CODES[number];
}
