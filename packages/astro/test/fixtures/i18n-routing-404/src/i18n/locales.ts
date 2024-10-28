export type Locales = Record<'en' | 'zh' | 'ja' | 'ko', string>;

export const LOCALE_NAMES: Locales = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

export const KNOWN_LANGUAGE_CODES = Object.keys(LOCALE_NAMES);
export const defaultLang = 'en';
