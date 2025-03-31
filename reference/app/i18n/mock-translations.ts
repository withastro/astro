import { type Namespace, type Locale } from './config';

// Mock translations for development without database
export const mockTranslations: Record<Locale, Record<Namespace, Record<string, any>>> = {
  de: {
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
    },
    ccT: {},
    navigation: {},
    home: {}
  },
  en: {
    common: {
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
        learnMore: 'Learn More',
        contact: 'Contact',
        getDemo: 'Request Demo',
        consultation: 'Schedule Consultation'
      },
      navigation: {
        home: 'Home',
        services: 'Services',
        about: 'About Us',
        contact: 'Contact'
      }
    },
    seoT: {
      meta: {
        defaultTitle: 'OnlineMarketingCORE - Marketing Automation & SEO',
        defaultDescription: 'Professional Online Marketing Solutions, Marketing Automation and SEO Optimization for your business.'
      }
    },
    ccT: {},
    navigation: {},
    home: {}
  },
  // Default empty objects for other locales
  nl: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  fr: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  it: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  es: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  pl: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  cs: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  no: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  sv: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  da: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  zh: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} },
  ja: { common: {}, seoT: {}, ccT: {}, navigation: {}, home: {} }
};

export function getMockTranslation(locale: Locale, namespace: Namespace) {
  return { [namespace]: mockTranslations[locale]?.[namespace] || {} };
} 