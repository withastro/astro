import { type Namespace, type Locale, defaultLocale } from './config'
import { getTranslation } from './server-utils'

interface TranslationResult {
  t: (key: string, params?: Record<string, any>) => string;
}

// Fallback translations when database isn't available
const fallbackTranslations: Record<string, Record<string, any>> = {
  common: {
    buttons: {
      submit: 'Absenden',
      cancel: 'Abbrechen',
      learnMore: 'Mehr erfahren',
      contact: 'Kontakt',
      getDemo: 'Demo anfragen',
      consultation: 'Beratung vereinbaren'
    },
    navigation: {
      home: 'Startseite',
      services: 'Dienstleistungen',
      about: 'Über uns',
      contact: 'Kontakt'
    }
  },
  seoT: {
    meta: {
      defaultTitle: 'OnlineMarketingCORE - Marketing Automation & SEO',
      defaultDescription: 'Professionelle Online Marketing Lösungen, Marketing Automatisierung und SEO Optimierung für Ihr Unternehmen.'
    }
  }
};

export async function getTranslations(
  locale: string,
  namespaces: Namespace[]
): Promise<TranslationResult> {
  // Default to the German locale if the provided locale isn't valid
  const validLocale = locale || defaultLocale;
  
  // Collect all translations for the specified namespaces
  const translations: Record<string, any> = {};
  
  // Fetch translations for each namespace
  for (const namespace of namespaces) {
    try {
      const nsTranslations = await getTranslation(validLocale as Locale, namespace);
      if (nsTranslations && Object.keys(nsTranslations[namespace] || {}).length > 0) {
        Object.assign(translations, nsTranslations);
      } else if (fallbackTranslations[namespace]) {
        // Use fallback translations if database returned empty or failed
        translations[namespace] = fallbackTranslations[namespace];
      }
    } catch (error) {
      console.warn(`Error loading translations for namespace ${namespace}:`, error);
      // Use fallback translations on error
      if (fallbackTranslations[namespace]) {
        translations[namespace] = fallbackTranslations[namespace];
      }
    }
  }
  
  // Return a translate function that looks up keys in the translations object
  return {
    t: (key: string, params?: Record<string, any>): string => {
      // Split the key by dots to navigate the translations object
      const parts = key.split('.');
      let value: any = translations;
      
      // Traverse the translations object following the path specified by the key
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          console.warn(`Translation missing: ${key} (${validLocale})`);
          return key; // Return the key itself if the translation is missing
        }
      }
      
      // If the value is a string, apply any parameter substitutions
      if (typeof value === 'string') {
        if (params) {
          // Replace placeholders like {{name}} with values from params
          return value.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
            return params[paramName] !== undefined ? String(params[paramName]) : `{{${paramName}}}`;
          });
        }
        return value;
      }
      
      console.warn(`Translation not a string: ${key} (${validLocale})`);
      return key;
    }
  };
} 