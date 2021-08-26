import { KNOWN_LANGUAGES } from './config.js';

export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export function getLanguageFromURL(pathname: string) {
  const langCodeMatch = pathname.match(/\/([a-z]{2}-?[A-Z]{0,2})\//);
  return langCodeMatch ? langCodeMatch[1] : 'en';
}
