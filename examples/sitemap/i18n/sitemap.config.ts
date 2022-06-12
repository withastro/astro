import i18n from './src/i18n.js';

/** @type {import('astro-sitemap').SitemapOptions} */
const sitemapConfig = {
  // added
  i18n: {
    defaultLocale: i18n.defaultLocale,
    locales: Object.entries(i18n.locales).reduce((prev, [locale, { lang }]) => {
      prev[locale] = lang;
      return prev;
    }, {}),
  },
};

export default sitemapConfig;
