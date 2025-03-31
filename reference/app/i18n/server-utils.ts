import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { defaultLocale, Locale, locales, Namespace, type TranslationNamespace } from './config'
import { getDb } from '../db'
import { translations } from '../db/schema'
import { getMockTranslation } from './mock-translations'

// Development flag to use mock translations instead of database
const USE_MOCK_TRANSLATIONS = process.env.NODE_ENV === 'development';

export async function getTranslation(
  locale: Locale,
  namespace: Namespace,
  key: string = 'all'
): Promise<TranslationNamespace | null> {
  // Use mock translations in development to avoid database dependency
  if (USE_MOCK_TRANSLATIONS) {
    return getMockTranslation(locale, namespace);
  }

  try {
    const dbInstance = await getDb();
    let result;

    // If key is 'all', fetch all translations for the namespace
    if (key === 'all') {
      result = await dbInstance
        .select({ key: translations.key, value: translations.value })
        .from(translations)
        .where(
          and(
            eq(translations.locale, locale),
            eq(translations.namespace, namespace)
          )
        );
    } else {
      result = await dbInstance
        .select({ key: translations.key, value: translations.value })
        .from(translations)
        .where(
          and(
            eq(translations.locale, locale),
            eq(translations.namespace, namespace),
            eq(translations.key, key)
          )
        )
        .limit(1);
    }

    // If no results found, return null
    if (!result.length) return null;

    // If fetching a single key, return its value
    if (key !== 'all' && result[0]?.value) {
      const structuredTranslations: TranslationNamespace = { [namespace]: {} };
      const nsObject = structuredTranslations[namespace] as Record<string, string | TranslationNamespace>;
      nsObject[key] = result[0].value;
      return structuredTranslations;
    }

    // If fetching all translations, structure them according to their keys
    const structuredTranslations: TranslationNamespace = { [namespace]: {} };
    
    for (const translation of result) {
      if (!translation.key || !translation.value) continue;
      
      const keyParts = translation.key.split('.');
      let current = structuredTranslations[namespace] as Record<string, string | TranslationNamespace>;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (part && !current[part]) {
          current[part] = {};
        }
        if (part) {
          current = current[part] as Record<string, string | TranslationNamespace>;
        }
      }
      
      const lastPart = keyParts[keyParts.length - 1];
      if (lastPart) {
        current[lastPart] = translation.value;
      }
    }

    return structuredTranslations;
  } catch (error) {
    console.error('Error fetching translation:', error);
    // Fallback to mock translations on error
    return getMockTranslation(locale, namespace);
  }
}

export async function getLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  return (locale || defaultLocale) as Locale;
}

export function validateLocale(locale: string): locale is Locale {
  return locale === defaultLocale || locales.includes(locale as Locale);
}