const canonicalURL = 'https://example.com';

const sitemapConfig = {
  filter: (page) => !/exclude-this/.test(page), // exclude pages from sitemap
  customPages: [`${canonicalURL}/virtual-one.html`, `${canonicalURL}/virtual-two.html`],
  canonicalURL,

  createLinkInHead: true,

  serialize(item) {
    if (/special-page/.test(item.url)) {
      item.changefreq = 'daily';
      item.lastmod = new Date();
      item.priority = 0.9;
    }
    return item;
  },

  // The integration creates a separate `sitemap-${i}.xml` file for each batch of 2, then adds this file to index - `sitemap-index.xml`.
  entryLimit: 2, // default - 45000

  // sitemap specific
  changefreq: 'yearly',
  lastmod: new Date('2019-12-31'),
  priority: 0.4,
};

export default sitemapConfig;
